const fs=require('fs');
let c=fs.readFileSync('projects/future-highway-alair/index.html','utf8');
const idx=c.indexOf('<title>');
const gtag = "<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-3P7J19LGXM');\n</script>\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-3P7J19LGXM\"></script>\n";
c=c.slice(0,idx)+gtag+c.slice(idx);
fs.writeFileSync('projects/future-highway-alair/index.html',c);
console.log(c.includes('G-3P7J19LGXM'));
