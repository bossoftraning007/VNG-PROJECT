const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
g=g.replace('}catch(e){}; global.GalleryRender','//force\n  if (typeof window!== "undefined" && document){ try{boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]"));}catch(e){} }\n}catch(e){}; global.GalleryRender');
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('done');
