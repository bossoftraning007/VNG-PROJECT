const fs=require('fs');
const c=fs.readFileSync('projects/future-highway-alair/index.html','utf8');
const idx=c.indexOf("brochureForm").onsubmit;
console.log(idx);
