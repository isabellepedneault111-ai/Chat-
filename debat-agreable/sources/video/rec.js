const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn}=require('child_process');const fs=require('fs');
const mode=process.argv[2]||'stills';
(async()=>{
 const T=JSON.parse(fs.readFileSync(__dirname+'/timing.json'));
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('console',m=>console.log('PAGE',m.text()));
 await p.addInitScript(t=>{window.TIMING=t},T);
 await p.goto('file://'+__dirname+'/video.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 const total=await p.evaluate(()=>window.TOTAL);console.log('total',total);
 if(mode==='stills'){
  const starts=await p.evaluate(()=>scenes.map(s=>[s.start,s.len]));
  for(let i=0;i<starts.length;i++){const [st,l]=starts[i];await p.evaluate(t=>renderAt(t),st+l-0.5);await p.screenshot({path:`${__dirname}/still-${String(i+1).padStart(2,'0')}.jpg`,type:'jpeg',quality:70});}
 } else {
  const fps=25,N=Math.ceil(total*fps);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','20',__dirname+'/silent.mp4']);
  for(let i=0;i<N;i++){await p.evaluate(t=>renderAt(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%500===0)console.log(i,'/',N);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();})();
