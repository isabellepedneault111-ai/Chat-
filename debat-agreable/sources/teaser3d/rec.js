const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');const path=require('path');
const mode=process.argv[2]||'stills';
const MIME={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary','.ttf':'font/ttf','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(__dirname,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(+process.argv[6]||8765);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('console',m=>{if(m.type()!=='log'||!/THREE/.test(m.text()))console.log('PAGE',m.type(),m.text())});p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://localhost:'+(+process.argv[6]||8765)+'/film.html');await p.waitForFunction(()=>window.READY,null,{timeout:120000});await p.evaluate(()=>document.fonts.ready);
 const total=await p.evaluate(()=>window.TOTAL);
 if(mode==='stills'){
  const ts=(process.argv[3]||'').split(',').map(Number);
  for(const t of ts){const t0=Date.now();await p.evaluate(t=>renderAt(t),t);await p.screenshot({path:`${__dirname}/s-${t}.jpg`,type:'jpeg',quality:80});console.log('frame',t,Date.now()-t0,'ms');}
 } else {
  const fps=30,N=Math.ceil(total*fps),from=+process.argv[3]||0,to=+process.argv[4]||N,out=process.argv[5]||'silent.mp4';
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','18',__dirname+'/'+out]);
  for(let i=from;i<to;i++){await p.evaluate(t=>renderAt(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150===0)console.log('frame',i,'/',to);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();srv.close();})();
