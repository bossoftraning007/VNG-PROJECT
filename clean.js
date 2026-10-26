const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
g=g.replace('//force','');
g=g.replace(/if \(typeof window !== "undefined" && document\)[^\n]*boot[^\n]*renderGallery[^\n]*renderPosters[^\n]*\}/,'try{boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]"));}catch(e){}');
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('done');
