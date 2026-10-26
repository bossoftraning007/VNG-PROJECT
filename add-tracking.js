const fs=require('fs');
['assets/js/main.js','projects/future-highway-alair/index.html'].forEach(f=>{
  let c=fs.readFileSync(f,'utf8');
  c=c.split('data-wa=').join('class="wa-click" data-wa=');
  c=c.split('data-phone-link').join('class="call-click" data-phone-link');
  fs.writeFileSync(f,c);
});
console.log('done');
