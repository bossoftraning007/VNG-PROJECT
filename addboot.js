const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const add='  try{boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]"));}catch(e){}\n';
g=g.replace('  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };', add+'  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };');
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('ok');
