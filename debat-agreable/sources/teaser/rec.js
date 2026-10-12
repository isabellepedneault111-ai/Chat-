const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn}=require('child_process');const fs=require('fs');
const mode=process.argv[2]||'stills';
(async()=>{
 const TL=JSON.parse(fs.readFileSync(__dirname+'/timeline.json'));
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
 await p.addInitScript(t=>{window.TL=t},TL);
 await p.goto('file://'+__dirname+'/teaser.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 if(mode==='stills'){
  for(const s of TL.scenes){await p.evaluate(t=>renderAt(t),s.start+s.dur*0.85);await p.screenshot({path:`${__dirname}/st-${s.id}.jpg`,type:'jpeg',quality:75});}
 } else {
  const fps=30,N=Math.ceil(TL.total*fps);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','19',__dirname+'/silent.mp4']);
  for(let i=0;i<N;i++){await p.evaluate(t=>renderAt(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();})();
