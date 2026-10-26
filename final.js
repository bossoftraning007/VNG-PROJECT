const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
g=g.replace('})(window);','  // final ensure\n  try{boot(); renderGallery(document.querySelector("[data-gallery]")); renderPosters(document.querySelector("[data-posters]"));}catch(e){}\n})(window);');
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('ok');
