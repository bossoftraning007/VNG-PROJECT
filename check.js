/* Lightweight structural check: tag balance + duplicate id detection.
   Run: node check.js  (from the project root) */
const fs = require("fs");
const path = require("path");

const VOID = new Set([
  "area","base","br","col","embed","hr","img","input","link","meta",
  "param","source","track","wbr",
]);

const pages = [
  "index.html",
  "projects/future-highway-alair/index.html",
];

let problems = 0;

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const stack = [];
  const ids = new Map();
  const counts = {};

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3];
    if (VOID.has(tag) || attrs.trim().endsWith("/")) continue;

    counts[tag] = (counts[tag] || 0) + (closing ? -1 : 1);

    if (!closing) {
      const idm = /\sid="([^"]+)"/.exec(attrs);
      if (idm) {
        if (ids.has(idm[1])) {
          console.log(`  ✗ duplicate id "${idm[1]}" in ${page}`);
          problems++;
        }
        ids.set(idm[1], true);
      }
      stack.push(tag);
    } else {
      const open = stack.pop();
      if (open !== tag) {
        console.log(`  ✗ closing </${tag}> but <${open}> was open — ${page}`);
        problems++;
      }
    }
  }

  if (stack.length) {
    console.log(`  ✗ ${stack.length} unclosed tag(s) in ${page}: ${stack.join(", ")}`);
    problems++;
  }

  /* Every internal #hash target must exist */
  const hrefRe = /href="#([^"]+)"/g;
  while ((m = hrefRe.exec(html))) {
    if (!ids.has(m[1])) {
      console.log(`  ✗ dead anchor #${m[1]} in ${page}`);
      problems++;
    }
  }

  /* Every <use href="#icon"> must have a matching symbol */
  const uses = new Set([...html.matchAll(/<use href="#([^"]+)"/g)].map((u) => u[1]));
  const syms = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((s) => s[1]));
  for (const u of uses) {
    if (!syms.has(u)) {
      console.log(`  ✗ icon #${u} used but not defined in ${page}`);
      problems++;
    }
  }

  const revealed = (html.match(/class="[^"]*\breveal\b/g) || []).length;
  console.log(
    `✓ ${page} — ${stack.length ? "" : ""}${Object.values(counts).filter((v) => v === 0).length} balanced tags, ` +
    `${ids.size} ids, ${uses.size} icons, ${revealed} reveal elements`
  );
}

/* CSS: check every var(--x) has a definition */
const css = fs.readFileSync("assets/css/style.css", "utf8");
const defined = new Set(
  [...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((d) => d[1])
);
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const used = new Set(
    [...html.matchAll(/var\((--[a-z0-9-]+)/gi)].map((u) => u[1])
  );
  for (const u of used) {
    if (!defined.has(u)) {
      console.log(`  ✗ undefined CSS var ${u} used in ${page}`);
      problems++;
    }
  }
}

/* JS syntax check */
try {
  new Function(fs.readFileSync("assets/js/main.js", "utf8"));
  console.log("✓ assets/js/main.js parses");
} catch (e) {
  console.log("  ✗ assets/js/main.js syntax error: " + e.message);
  problems++;
}

console.log(problems ? `\n${problems} problem(s) found` : "\nNo structural problems found");
process.exit(problems ? 1 : 0);
