const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const old = '  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }';
const nw = '  try{run();}catch(e){}; setTimeout(run,0); if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }';
if(g.includes(old)){ g=g.replace(old,nw); fs.writeFileSync('assets/js/gallery-render.js',g); console.log('ok'); }else{ console.log('no'); }
