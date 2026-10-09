/* ==========================================================================
   VNG PROJECTS — Site behaviour
   Vanilla JS, no dependencies.
   Sections: 1 Config · 2 Helpers · 3 Header · 4 Reveal · 5 Counters
             6 Media slots · 7 Price calculator · 8 Accordion · 9 Forms
   ========================================================================== */

/* 1. CONFIG =============================================================
   ⚠️  REPLACE THESE BEFORE GOING LIVE — they are used site-wide.
   WhatsApp number in international format, digits only, no "+" or spaces.
   ====================================================================== */
const CONFIG = {
  whatsapp: "919505903371",
  phone: "+919505903371",
  phoneDisplay: "+91 95059 03371",
  secondaryPhone: "+919849754071",
  secondaryPhoneDisplay: "+91 98497 54071",
  email: "rasamallaganesh71@gmail.com",
};

if (!CONFIG.whatsapp || !CONFIG.phone) {
  console.error(
    "[Kanii] CONFIG.whatsapp or CONFIG.phone is not set — contact links will be wrong."
  );
}

/* 2. HELPERS ============================================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

document.documentElement.classList.remove("no-js");

/* Indian numbering format: 1,60,00,000 */
function formatINR(value) {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

function waLink(message) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

/* 3. HEADER ============================================================== */
function initHeader() {
  const header = $(".header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-stuck", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Burger + drawer */
  const burger = $(".burger");
  const drawer = $(".drawer");
  if (!burger || !drawer) return;

  const setOpen = (open) => {
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    drawer.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
  };

  burger.addEventListener("click", () =>
    setOpen(!burger.classList.contains("is-open"))
  );
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  /* Highlight the nav item for the section in view */
  const links = $$(".nav__link[href^='#']");
  if (!links.length) return;
  const map = new Map();
  links.forEach((l) => {
    const sec = document.getElementById(l.getAttribute("href").slice(1));
    if (sec) map.set(sec, l);
  });
  if (!map.size) return;

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove("is-active"));
        const active = map.get(entry.target);
        if (active) active.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  map.forEach((_, sec) => spy.observe(sec));
}

/* 4. REVEAL ============================================================= */
function initReveal() {
  /* Class-based, not attribute-based: without JS the content stays visible */
  const items = $$(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  /* Auto-stagger siblings inside the same parent */
  const groups = new Map();
  items.forEach((el) => {
    const key = el.parentElement;
    const n = groups.get(key) || 0;
    el.style.setProperty("--d", Math.min(n, 6) * 0.09 + "s");
    groups.set(key, n + 1);
  });

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* 5. COUNTERS ============================================================ */
function initCounters() {
  const nums = $$("[data-count]");
  if (!nums.length) return;

  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";

    if (prefersReducedMotion) {
      el.textContent = prefix + target.toFixed(dec) + suffix;
      return;
    }

    const dur = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      /* easeOutExpo */
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = prefix + (target * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) {
    nums.forEach(run);
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach((el) => io.observe(el));
}

/* Horizontal comparison bars fill once visible */
function initCompareBars() {
  const bars = $$("[data-fill]");
  if (!bars.length) return;
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.width = entry.target.dataset.fill + "%";
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  bars.forEach((b) => io.observe(b));
}

/* 6. MEDIA SLOTS =========================================================
   Any <img> inside .media that fails to load hides itself, so the frame
   falls back to the designed gradient placeholder. Images that do load
   remove the "drop photo here" tag.
   ====================================================================== */
function initMediaSlots() {
  $$(".media").forEach((frame) => {
    const img = $("img", frame);
    if (!img) return;
    const mark = () => {
      if (img.naturalWidth > 0) {
        frame.classList.add("is-filled");
        frame.classList.remove("is-broken");
      } else {
        frame.classList.remove("is-filled");
        /* Hide the <img> entirely so no broken-image glyph shows through */
        frame.classList.add("is-broken");
      }
    };
    if (img.complete) mark();
    else {
      img.addEventListener("load", mark, { once: true });
      img.addEventListener("error", mark, { once: true });
    }
  });
}

/* 7. PRICE CALCULATOR ==================================================== */
function initCalculator() {
  const form = $("[data-calc]");
  if (!form) return;

  const RATE = parseFloat(form.dataset.rate || "12000");
  const out = $("[data-calc-out]", form);
  const note = $("[data-calc-note]", form);

  const render = () => {
    const size = parseFloat(form.elements.plotSize.value);
    const facing = parseFloat(form.elements.facing?.value || "0");
    if (!size) {
      out.textContent = "—";
      if (note) note.textContent = "Select a plot size to see the indicative price.";
      return;
    }
    let total = size * RATE;
    let extra = "";

    if (facing) {
      total += size * facing;
      extra = ` (incl. ${facing >= 0 ? "+" : "−"}₹${Math.abs(facing).toLocaleString(
        "en-IN"
      )}/sq.yd ${facing >= 0 ? "corner" : "interior"} premium)`;
    }
    out.textContent = formatINR(total);
    if (note)
      note.textContent = `${size} sq. yd × ₹${RATE.toLocaleString(
        "en-IN"
      )}/sq.yd${extra}. Registration, GST, documentation and plot
      maintenance charges extra. Price indicative & negotiable.`;
  };

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}

/* 8. ACCORDION ========================================================== */
function initAccordion() {
  const acc = $("[data-acc]");
  if (!acc) return;
  $$(".acc__btn", acc).forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".acc__item");
      const panel = $(".acc__panel", item);
      const open = item.classList.contains("is-open");

      $$(".acc__item.is-open", acc).forEach((other) => {
        other.classList.remove("is-open");
        $(".acc__panel", other).style.height = "0px";
        $(".acc__btn", other).setAttribute("aria-expanded", "false");
      });

      if (!open) {
        item.classList.add("is-open");
        panel.style.height = panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* 9. FORMS → WhatsApp ====================================================
   No backend needed: the enquiry is composed into a WhatsApp message.
   To use a real form service instead, swap this handler.
   ====================================================================== */
function initForms() {
  $$("[data-enquiry]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const get = (k) => (data.get(k) || "").toString().trim();

      const plot = form.querySelector("[data-calc-out]");
      const lines = [
        `New enquiry — ${form.dataset.enquiry}`,
        "",
        `Name: ${get("name") || "—"}`,
        `Phone: ${get("phone") || "—"}`,
      ];
      if (get("email")) lines.push(`Email: ${get("email")}`);
      if (get("plotSize"))
        lines.push(`Plot size: ${get("plotSize")} sq. yd`);
      if (get("budget")) lines.push(`Budget: ${get("budget")}`);
      if (plot && plot.textContent !== "—")
        lines.push(`Indicative value: ${plot.textContent}`);
      if (get("message")) lines.push("", get("message"));

      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      form.reset();
      if (plot) plot.textContent = "—";
      form.dispatchEvent(new CustomEvent("enquiry:sent", { bubbles: true }));
    });
  });

  /* Every [data-wa] link gets the prefilled message */
  $$("[data-wa]").forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* Live-fill phone display text from CONFIG */
  $$("[data-phone]").forEach((el) => (el.textContent = CONFIG.phoneDisplay));
  $$("[data-phone-link]").forEach((el) => (el.href = "tel:" + CONFIG.phone));
  $$("[data-email]").forEach((el) => (el.textContent = CONFIG.email));
}

/* BOOT ================================================================== */
const INIT = {
  header: initHeader,
  media: initMediaSlots,
  reveal: initReveal,
  counters: initCounters,
  compare: initCompareBars,
  calculator: initCalculator,
  accordion: initAccordion,
  forms: initForms,
};

/* Each feature is isolated: one broken block must never take down the rest
   of the page, and the failure is reported instead of failing silently. */
function boot() {
  Object.keys(INIT).forEach((name) => {
    try {
      INIT[name]();
    } catch (err) {
      console.error(`[Kanii] "${name}" failed to initialise:`, err);
    }
  });
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", boot)
  : boot();