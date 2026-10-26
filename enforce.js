const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const nw='  // ensure\n  try{boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]"));}catch(e){}\n  try{run();}catch(e){} setTimeout(run,0);';
g=g.replace('  try{run();}catch(e){} setTimeout(run,0);', nw);
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('ok');
