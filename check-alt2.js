const fs=require('fs');
const html=fs.readFileSync('projects/future-highway-alair/index.html','utf8');
const re=/alt="([^"]*)"/g;
let m,alts=[];
while((m=re.exec(html))){ alts.push(m[1]); }
console.log(alts);
