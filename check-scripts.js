fetch('https://vng-projects.vercel.app/').then(r=>r.text()).then(t=>{
  const re=/<script[^>]*src="([^"]*)"/g;
  let m,s=[];
  while((m=re.exec(t)))s.push(m[1]);
  console.log('Scripts:',s);
});