const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const old = '  function run() {\n    boot();\n    refreshFromBackend();\n  }\n\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", run);\n  } else {\n    run();\n  }\n\n  setTimeout(run,0);';
const nw = '  function run() { boot(); refreshFromBackend(); }\n  try { run(); } catch(e) {}\n  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }';
if(g.includes(old)){ g=g.replace(old,nw); fs.writeFileSync('assets/js/gallery-render.js',g); console.log('ok'); }else{ console.log('not found'); console.log('check last 200 chars:'); console.log(g.slice(-200)); }
