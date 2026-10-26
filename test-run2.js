const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const old = '  setTimeout(run, 0);\n\n  setTimeout(run,0);';
const nw = '  try{run();}catch(e){}\n  setTimeout(run,0);\n  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }';
if(g.includes(old)){ g=g.replace(old,nw); fs.writeFileSync('assets/js/gallery-render.js',g); console.log('ok'); }else{ console.log('no'); }
