// Capture the actual checked-out websites; no visual mock-ups or generated UI.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const name = process.env.PROJECT_NAME;
const base = 'http://127.0.0.1:8765';
const output = path.resolve('captures');
fs.mkdirSync(output,{recursive:true});
const timeout = setTimeout(()=>{console.error('Preview capture timed out.');process.exit(1);},180000);
timeout.unref();
function exportImage(filename, bytes) {
  const encoded=bytes.toString('base64'),size=6000,total=Math.ceil(encoded.length/size);
  for(let i=0;i<total;i++) console.log(`PORTFOLIO_IMAGE ${name}/${filename} ${i+1}/${total} ${encoded.slice(i*size,(i+1)*size)}`);
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'load',timeout:60000});
  await page.evaluate(()=>document.fonts.ready);
  if(name==='BugTracker') {
    await page.locator('#admin-user').fill('admin');
    await page.locator('#admin-pass').fill('1234');
    await page.locator('.btn-login').click();
    await page.locator('#main-app').waitFor({state:'visible'});
    await page.locator('button[onclick="seedDatabase()"]').click();
    if(await page.locator('.issue-item').count()!==10)throw Error('Sample issues were not loaded.');
  }
  if(name==='porgyandbess') {
    await page.locator('#overture-skip').click();
    await page.locator('#enter-btn').click();
    await page.locator('#intro-overlay').waitFor({state:'hidden'});
    await page.waitForFunction(()=>!animating);
  }
  if(name==='umembeso') await page.locator('#preloader').waitFor({state:'hidden'});
  await page.waitForTimeout(1200);
  async function capture(filename) {
    const bytes=await page.screenshot({path:path.join(output,filename),type:'jpeg',quality:88,animations:'disabled',fullPage:false});
    exportImage(filename,bytes);
  }
  await capture('desktop.jpg');
  if(name==='into-the-mind-website') {
    await page.goto(base+'/articles.html',{waitUntil:'load'});
    await capture('articles.jpg');
    await page.goto(base,{waitUntil:'load'});
  }
  if(name==='porgyandbess') {
    await page.locator('#menu-toggle').click();
    await page.locator('#menu-nav button[data-page="creative"]').click();
    await page.waitForFunction(()=>!animating);
    await capture('creative.jpg');
  }
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(500);
  await capture('mobile.jpg');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PORTFOLIO_META '+JSON.stringify({project:name,source:execFileSync('git',['-C','project','rev-parse','HEAD'],{encoding:'utf8'}).trim(),date:new Date().toISOString(),browser:'Chromium',desktop:'1440x1000',mobile:'390x844'}));
 } finally {await browser.close();}
})().catch(error=>{console.error(error.stack);process.exit(1);});
