const fs=require('fs');
const c=fs.readFileSync('projects/future-highway-alair/index.html','utf8');
const idx=c.indexOf("brochureForm").onsubmit;
if(idx=== -1){
  const idx2=c.indexOf('brochureForm');
  console.log(c.slice(idx2,idx2+500));
}else{
  console.log(c.slice(idx-100,idx+400));
}
