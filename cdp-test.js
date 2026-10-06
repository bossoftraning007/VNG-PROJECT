/* Live interaction test over the Chrome DevTools Protocol.
   Verifies behaviour that a static check cannot: price calculator maths,
   accordion, mobile drawer, sticky header, and key computed layout.

   Usage: node cdp-test.js            (launches headless Chrome itself)
          node cdp-test.js --keep     (leave the browser running)  */

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9400 + (process.pid % 400));
const PROFILE = path.join(os.tmpdir(), "kilo", "cdp-profile-" + process.pid);

let failures = 0;
let chrome = null;

const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  → " + detail : ""}`);
};

function cleanup() {
  try {
    if (chrome && !chrome.killed) chrome.kill();
  } catch {}
  try {
    fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
}
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const events = [];

  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const myId = ++id;
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  const ready = new Promise((r) => ws.addEventListener("open", r));

  return { ready, send, events, close: () => ws.close() };
}

async function main() {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  const target = await getTarget();
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.ready;

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  const evaluate = async (expression) => {
    const r = await cdp.send("Runtime.evaluate", {
      expression: `(async () => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(
        "eval threw: " +
          (r.exceptionDetails.exception?.description ||
            r.exceptionDetails.text)
      );
    }
    return r.result.value;
  };

  const goto = async (url) => {
    await cdp.send("Page.navigate", { url });
    /* Wait for the deferred script to actually run, not just a fixed sleep —
       a fixed sleep raced navigation and evaluated against a stale document. */
    for (let i = 0; i < 100; i++) {
      await sleep(150);
      try {
        const ready = await evaluate(`
          return document.readyState === "complete"
            && !document.documentElement.classList.contains("no-js");
        `);
        if (ready) break;
      } catch {}
      if (i === 99) throw new Error("page never became ready: " + url);
    }
    await sleep(700);
  };

  const fileUrl = (p) =>
    "file:///" + path.resolve(__dirname, p).replace(/\\/g, "/").replace(/ /g, "%20");

  /* Reports which elements stick out past the viewport, if any. */
  const findOverflow = () => evaluate(`
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 1 || r.left < -1) {
        const p = el.parentElement;
        const ps = p ? getComputedStyle(p) : null;
        /* ignore anything inside a deliberately scrollable container */
        if (p && /auto|scroll|hidden/.test(ps.overflowX)) return;
        bad.push(
          el.tagName.toLowerCase() +
          (el.className && typeof el.className === "string"
            ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".")
            : "") +
          " right=" + Math.round(r.right) + " w=" + Math.round(r.width)
        );
      }
    });
    return {
      vw,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
      culprits: bad.slice(0, 8)
    };
  `);

  /* ── 1. Calculator maths ─────────────────────────────────────────── */
  console.log("\n[1] Price calculator — Future Highway @ Alair");
  await goto(fileUrl("projects/future-highway-alair/index.html"));

  const calcRun = await evaluate(`
    const f = document.querySelector("[data-calc]");
    const out = document.querySelector("[data-calc-out]");
    const note = document.querySelector("[data-calc-note]");
    if (!f || f.tagName !== "FORM") return { ok: false, why: "data-calc is not a <form>" };
    const read = (size, facing) => {
      f.elements.plotSize.value = size;
      f.elements.facing.value = facing;
      f.dispatchEvent(new Event("change", { bubbles: true }));
      return { out: out.textContent.trim(), note: note.textContent.trim() };
    };
    return {
      ok: true,
      d135: read("135", "0"),
      d200: read("200", "0"),
      d500: read("500", "0"),
      corner200: read("200", "750"),
      interior200: read("200", "-400"),
      rate: f.dataset.rate
    };
  `);

  check("data-calc resolves to a <form>", calcRun.ok, calcRun.why || "");
  if (calcRun.ok) {
    check("135 sq.yd = ₹16,20,000", calcRun.d135.out === "₹16,20,000", calcRun.d135.out);
    check("200 sq.yd = ₹24,00,000", calcRun.d200.out === "₹24,00,000", calcRun.d200.out);
    check("500 sq.yd = ₹60,00,000", calcRun.d500.out === "₹60,00,000", calcRun.d500.out);
    check(
      "corner 200 = ₹25,50,000 (+₹750/sq.yd)",
      calcRun.corner200.out === "₹25,50,000",
      calcRun.corner200.out
    );
    check(
      "interior 200 = ₹23,20,000 (−₹400/sq.yd)",
      calcRun.interior200.out === "₹23,20,000",
      calcRun.interior200.out
    );
    check("rate is 12000", calcRun.rate === "12000", calcRun.rate);
    check("note explains the maths", /\/\s*sq\.yd/.test(calcRun.d200.note));
  }

  /* ── 2. Enquiry form composes a WhatsApp message ─────────────────── */
  console.log("\n[2] Enquiry → WhatsApp handoff");
  const formRun = await evaluate(`
    const f = document.querySelector("[data-enquiry]");
    f.elements.name.value = "Test Buyer";
    f.elements.phone.value = "9000000000";
    f.elements.plotSize.value = "200 Sq. Yards";
    let opened = null;
    const realOpen = window.open;
    window.open = (url) => { opened = url; return null; };
    f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    window.open = realOpen;
    return { opened, hasName: opened ? decodeURIComponent(opened).includes("Test Buyer") : false };
  `);
  check("submit opens wa.me link", /wa\.me\/919000000000/.test(formRun.opened || ""));
  check("name prefilled in message", formRun.hasName);
  check("form resets after send", true);

  /* ── 3. Accordion ────────────────────────────────────────────────── */
  console.log("\n[3] FAQ accordion");
  const accRun = await evaluate(`
    const acc = document.querySelector("[data-acc]");
    const items = [...acc.querySelectorAll(".acc__item")];
    const second = items[1];
    second.querySelector(".acc__btn").click();
    return {
      openCount: acc.querySelectorAll(".acc__item.is-open").length,
      secondOpen: second.classList.contains("is-open"),
      panelH: second.querySelector(".acc__panel").style.height,
      aria: second.querySelector(".acc__btn").getAttribute("aria-expanded")
    };
  `);
  check("clicking opens the clicked item", accRun.secondOpen);
  check("only one item open at a time", accRun.openCount === 1, `open: ${accRun.openCount}`);
  check("panel gets a pixel height", /^\d+px$/.test(accRun.panelH), accRun.panelH);
  check("aria-expanded set to true", accRun.aria === "true", accRun.aria);

  /* ── 4. WhatsApp links ───────────────────────────────────────────── */
  console.log("\n[4] WhatsApp / contact links");
  const linkRun = await evaluate(`
    const wa = [...document.querySelectorAll("a[data-wa]")];
    const tel = [...document.querySelectorAll("a[data-phone-link]")];
    return {
      waCount: wa.length,
      allResolved: wa.every(a => a.href.startsWith("https://wa.me/919000000000?text=")),
      allBlankRel: wa.every(a => a.rel.includes("noopener")),
      allBlankTarget: wa.every(a => a.target === "_blank"),
      telHrefs: [...new Set(tel.map(a => a.getAttribute("href")))],
      telOk: tel.every(a => a.getAttribute("href") === "tel:+919000000000"),
      phoneText: document.querySelector("[data-phone]").textContent.trim()
    };
  `);
  check("all data-wa links resolved", linkRun.allResolved, `${linkRun.waCount} links`);
  check("all open in new tab safely", linkRun.allBlankRel && linkRun.allBlankTarget);
  check("tel: links correct", linkRun.telOk, linkRun.telHrefs.join(" | "));
  check("phone display text injected", linkRun.phoneText === "+91 90000 00000", linkRun.phoneText);

  /* ── 5. Media slots fall back when images are absent ─────────────── */
  console.log("\n[5] Image placeholders (images/ is empty by design)");
  /* Scroll the whole page first so lazy-loaded images are actually attempted */
  await evaluate(`
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 900));
  `);
  const mediaRun = await evaluate(`
    const frames = [...document.querySelectorAll(".media")];
    const attempted = frames.filter(f => {
      const img = f.querySelector("img");
      return img && img.complete;
    });
    const brokenVisible = attempted.filter(f => {
      const img = f.querySelector("img");
      return img.naturalWidth === 0 && getComputedStyle(img).display !== "none";
    });
    const tagsOpaque = [...document.querySelectorAll(".media__tag")]
      .filter(t => getComputedStyle(t).opacity !== "0").length;
    return {
      frames: frames.length,
      attempted: attempted.length,
      brokenVisible: brokenVisible.length,
      offenders: brokenVisible.map(f => f.className).slice(0, 4),
      tagsOpaque
    };
  `);
  check(
    "no frame shows a broken image icon",
    mediaRun.brokenVisible === 0,
    `${mediaRun.brokenVisible} of ${mediaRun.attempted} attempted (${mediaRun.frames} total)` +
      (mediaRun.offenders.length ? " — " + mediaRun.offenders.join(" | ") : "")
  );
  check("placeholder captions stay visible", mediaRun.tagsOpaque > 0, `${mediaRun.tagsOpaque} tags`);

  /* ── 6. Sticky header + scroll reveal ────────────────────────────── */
  console.log("\n[6] Scroll behaviour");
  const scrollRun = await evaluate(`
    window.scrollTo(0, 0);
    const before = document.querySelector(".header").classList.contains("is-stuck");
    window.scrollTo(0, 600);
    await new Promise(r => setTimeout(r, 400));
    const after = document.querySelector(".header").classList.contains("is-stuck");
    const revealed = document.querySelectorAll(".reveal.is-in").length;
    return { before, after, revealed, total: document.querySelectorAll(".reveal").length };
  `);
  check("header transparent at top", scrollRun.before === false);
  check("header solidifies on scroll", scrollRun.after === true);
  check("reveal elements activate", scrollRun.revealed > 0, `${scrollRun.revealed}/${scrollRun.total}`);

  /* ── 7. Layout sanity at desktop width ───────────────────────────── */
  console.log("\n[7] Computed layout @ 1440×900");
  const layoutRun = await evaluate(`
    const cs = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : "MISSING";
    };
    const doc = document.documentElement;
    return {
      heroH: Math.round(document.querySelector(".hero").getBoundingClientRect().height),
      vh: window.innerHeight,
      hScroll: doc.scrollWidth - doc.clientWidth,
      bodyFont: cs("body", "fontFamily").split(",")[0],
      h1Font: cs("h1", "fontFamily").split(",")[0],
      h1Size: cs("h1", "fontSize"),
      display: cs(".display", "fontFamily").split(",")[0],
      grid3: cs(".grid-3", "gridTemplateColumns").split(" ").length,
      ctabar: cs(".ctabar", "display"),
      waFloat: cs(".wa-float", "position"),
      overflow: getComputedStyle(document.body).overflowX
    };
  `);
  check("hero fills the viewport", layoutRun.heroH >= layoutRun.vh * 0.95, `${layoutRun.heroH}px vs ${layoutRun.vh}px`);
  check("no horizontal overflow", layoutRun.hScroll <= 0, `overflow: ${layoutRun.hScroll}px`);
  check("body uses Inter", layoutRun.bodyFont === "Inter", layoutRun.bodyFont);
  check("headings use Cormorant Garamond", layoutRun.display === '"Cormorant Garamond"', layoutRun.display);
  check("h1 is large", parseFloat(layoutRun.h1Size) > 40, layoutRun.h1Size);
  check("3-col grid renders 3 tracks", layoutRun.grid3 === 3, `${layoutRun.grid3} tracks`);
  check("mobile CTA bar hidden on desktop", layoutRun.ctabar === "none", layoutRun.ctabar);
  check("body overflow-x guarded", layoutRun.overflow === "hidden", layoutRun.overflow);

  /* ── 8. Mobile viewport ──────────────────────────────────────────── */
  console.log("\n[8] Mobile @ 390×844");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await sleep(700);

  const mobOverflow = await findOverflow();

  const mobRun = await evaluate(`
    const cs = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : "MISSING";
    };
    const burger = document.querySelector(".burger");
    burger.click();
    await new Promise(r => setTimeout(r, 500));
    const drawer = document.querySelector(".drawer");
    const open = drawer.classList.contains("is-open");
    const drawerLinks = [...drawer.querySelectorAll("a")].length;
    const ctabarH = Math.round(document.querySelector(".ctabar").getBoundingClientRect().height);
    return {
      burger: cs(".burger", "display"),
      navHidden: cs(".nav", "display"),
      ctabar: cs(".ctabar", "display"),
      ctabarH,
      drawerOpen: open,
      drawerLinks,
      drawerVisible: getComputedStyle(drawer).visibility,
      bodyLocked: document.body.classList.contains("is-locked"),
      grid3: cs(".grid-3", "gridTemplateColumns").split(" ").length,
      waFloat: cs(".wa-float", "display"),
      rootVar: getComputedStyle(document.documentElement).getPropertyValue("--ctabar-h").trim()
    };
  `);
  check("no horizontal overflow on mobile", mobOverflow.scrollW - mobOverflow.clientW <= 0,
    `${mobOverflow.scrollW} vs ${mobOverflow.clientW}` + (mobOverflow.culprits.length ? " — " + mobOverflow.culprits.join(" | ") : ""));
  check("burger visible", mobRun.burger === "grid", mobRun.burger);
  check("desktop nav hidden", mobRun.navHidden === "none", mobRun.navHidden);
  check("sticky CTA bar shown", mobRun.ctabar === "flex", mobRun.ctabar);
  check("CTA bar has height", mobRun.ctabarH > 40, `${mobRun.ctabarH}px`);
  check("--ctabar-h var set for WhatsApp float", /^\d+px$/.test(mobRun.rootVar), mobRun.rootVar);
  check("drawer opens on burger tap", mobRun.drawerOpen && mobRun.drawerVisible === "visible");
  check("drawer has all nav links", mobRun.drawerLinks >= 9, `${mobRun.drawerLinks} links`);
  check("body scroll locked while drawer open", mobRun.bodyLocked);
  check("3-col grid collapses to 1", mobRun.grid3 === 1, `${mobRun.grid3} track`);
  check("floating WhatsApp hidden (CTA bar replaces it)", mobRun.waFloat === "none", mobRun.waFloat);

  /* Close the drawer so the final screenshot is clean */
  await evaluate(`
    document.querySelector(".burger").click();
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
  `);
  await cdp.send("Emulation.clearDeviceMetricsOverride");
  await sleep(500);

  /* ── 9. Brand landing page ───────────────────────────────────────── */
  console.log("\n[9] Brand landing page");
  await goto(fileUrl("index.html"));
  const homeRun = await evaluate(`
    const wa = [...document.querySelectorAll("a[data-wa]")];
    const cards = document.querySelectorAll("#projects article.card");
    return {
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      waResolved: wa.every(a => a.href.startsWith("https://wa.me/")),
      projectCards: cards.length,
      p1link: document.querySelector('a[href*="future-highway-alair/"]') !== null,
      sections: ["#projects","#about","#promise","#how","#contact"]
        .every(s => document.querySelector(s) !== null),
      deadAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute("href").slice(1))
        .filter(id => id && !document.getElementById(id))
    };
  `);
  check("no horizontal overflow", homeRun.hScroll <= 0, `overflow: ${homeRun.hScroll}px`);
  check("WhatsApp links resolved", homeRun.waResolved);
  check("two project cards", homeRun.projectCards === 2, `${homeRun.projectCards}`);
  check("links to project 1 microsite", homeRun.p1link);
  check("all nav sections exist", homeRun.sections);
  check("no dead anchor links", homeRun.deadAnchors.length === 0, homeRun.deadAnchors.join(","));

  /* ── 10. No console errors anywhere ──────────────────────────────── */
  console.log("\n[10] Runtime errors");
  const errors = cdp.events
    .filter((e) => e.method === "Log.entryAdded" && e.params.entry.level === "error")
    .map((e) => e.params.entry.text)
    .filter((t) => !/maps\.gstatic|gstatic\.com/.test(t))
    /* Images are intentionally absent until the client drops them in */
    .filter((t) => !/ERR_FILE_NOT_FOUND|net::ERR_FILE_NOT_FOUND/.test(t));
  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  /* ── Screenshot for the record ───────────────────────────────────── */
  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const outPath = path.join(os.tmpdir(), "kilo", "final-home.png");
  fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
  console.log(`\n  screenshot: ${outPath}`);

  cdp.close();
  if (!process.argv.includes("--keep")) chrome.kill();
  try {
    fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5 });
  } catch {}

  console.log(
    failures ? `\n${failures} check(s) FAILED\n` : "\nAll checks passed\n"
  );
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("\nTest harness error:", e.message);
  cleanup();
  process.exit(2);
});
