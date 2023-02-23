const puppeteer = require('puppeteer');
const unixPrinter = require("unix-print") ;

// Create a browser instance
async function pr(){
    const browser = await puppeteer.launch();

// Create a new page
const page = await browser.newPage();
await page.goto("file:///Users/asaadedd/workspace/print-app/template.html", { waitUntil: 'networkidle0' });
await page.emulateMediaType('screen');


  const someFunctionReturnedValue = await page.evaluate(() => {

    let h = parseInt((document.getElementById("invoice-POS").offsetHeight) * 0.26)/2
    let w = parseInt(document.getElementById("invoice-POS").offsetWidth *0.26) 
    console.log(h)
    return [w+"mm",h+"mm",w,h]
 });

  boxes2 = someFunctionReturnedValue;
  console.log(boxes2)
const pdf = await page.pdf({
    path: 'result.pdf',
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    printBackground: true,
    width: boxes2[0],
    height: boxes2[1]
  }); 

  var isWin = process.platform === "win32";

  if(isWin)
  {
    //   return  windowsPrinter.print(fileName,"XPrinter XP-80")
  }
  else{


      const printer = "XPrinter_XP_80_2";
      const options = [ ` -o media=Custom.${boxes2[2]}x${boxes2[3]}`];
      console.log(options)
       return unixPrinter.print("result.pdf",printer,options)
  }
  await browser.close();

}
pr()