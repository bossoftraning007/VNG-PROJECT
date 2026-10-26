const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
const marker='  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };';
if(g.includes(marker)){
  const nw='  // force\n  if (typeof window !== "undefined" && document) { try { boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]")); } catch(e){} }\n  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };';
  g=g.replace(marker,nw);
  fs.writeFileSync('assets/js/gallery-render.js',g);
  console.log('ok');
}else console.log('not found');
