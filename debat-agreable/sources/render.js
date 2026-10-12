const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await b.newPage();await p.goto('file://'+__dirname+'/zine.html');await p.waitForTimeout(800);
await p.pdf({path:__dirname+'/zine.pdf',width:'11in',height:'8.5in',printBackground:true});await b.close();})();
