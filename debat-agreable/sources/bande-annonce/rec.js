const {chromium}=require('/opt/node22/lib/node_modules/playwright');const {spawn}=require('child_process');
const mode=process.argv[2]||'stills';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/best.html');await p.waitForFunction(()=>window.READY);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const total=await p.evaluate(()=>TOTAL);
if(mode==='stills'){for(const t of process.argv[3].split(',').map(Number)){await p.evaluate(t=>renderAt(t),t);await p.screenshot({path:`${__dirname}/s-${t}.jpg`,type:'jpeg',quality:80});}}
else{const fps=30,N=Math.round(total*fps);const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-preset','medium',__dirname+'/silent.mp4']);
for(let i=0;i<N;i++){await p.evaluate(t=>renderAt(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));}
await b.close();})();
