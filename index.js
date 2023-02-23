const { io } = require("socket.io-client");

const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

const fs = require("fs")




const socket = io("http://localhost:3000/printers");
const windowsPrinter = require("pdf-to-printer") ;
const unixPrinter = require("unix-print") ;
const tableName = "printOrders"
const knex = require('knex')({
    client: 'better-sqlite3', // or 'better-sqlite3'
    connection: {
      filename: "./main.db",
    },
    useNullAsDefault: true
  });
socket.connect()

socket.on("printOnPrinter",async(order,callback)=>{

    let orderId = order.orderId
    let s = await knex.select("orderId").from(tableName).where("orderId",orderId)
   
    if(s.length != 0) 
    {
        if(s.status == "completed")
     
        sendPrintCompletedEvent(order.orderId)
        callback({status: "ok"})
        return;
    }
    order.status = "pending"
    await knex.insert(order).into(tableName)
    try
    {
        let printResult = await printFile(order.order)
        console.log("order printed succsfuly")
        await knex(tableName).update("status","completed").where("orderId",order.orderId)

    
        sendPrintCompletedEvent(order.orderId)
    }
    catch(err)
    {
        console.log(err)
        console.log("printError")
    }
    
    callback({
        status: "ok"
      })
})


function sendPrintCompletedEvent(orderId)
{
    socket.timeout(5000).emit("printCompleted",orderId,async(err,response)=>{
            
        if(err || response.status != "ok")
        {
            console.log("error")
        }
        else
        {
            console.log("server recived")
        }
    })
}


async function printFile(order)
{
    let todayDate ="./pdfs/"+ getDate(0)
    let yesterdayDate = "./pdfs/"+ getDate(1)
    fs.rmSync(yesterdayDate, { recursive: true, force: true });

    if (!fs.existsSync(todayDate)){
        fs.mkdirSync(todayDate);
    }
    
  
    let fileName  = todayDate+"/"+ getRandomFileName() +".pdf"
    console.log(order)
    order=JSON.parse(order)
    const browser = await puppeteer.launch();

    // Create a new page
    const page = await browser.newPage();
    await page.goto("file:///Users/asaadedd/workspace/print-app/template.html", { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    
    
      const someFunctionReturnedValue = await page.evaluate((order) => {
        order.forEach(item=>{
            addRowToInvoice(item.product.name,item.product.price,item.values.newQuantity,item.product.price,item.values.newPrice)
        })
        let h = parseInt((document.getElementById("invoice-POS").offsetHeight) * 0.26)
        let w = parseInt(document.getElementById("invoice-POS").offsetWidth *0.26) 
        console.log(h)
        return [w+"mm",h+"mm",w,h]
     },order);
    
      boxes2 = someFunctionReturnedValue;
      console.log(boxes2)
    const pdf = await page.pdf({
        path: fileName,
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
          const options = [ ` `];
          console.log(options)
           return unixPrinter.print(fileName,printer,options)
      }
      await browser.close();
    

 
    
 

}
setInterval(async()=>{
    let pendingResendItems = await knex.from(tableName).where("status","pendingResend").orWhere("status","pending")

    for(let item of pendingResendItems)
    {
        let order = item
        try
        {
        
            let printResult = await printFile(order.order)
            console.log("order printed succsfuly")
            await knex(tableName).update("status","completed").where("orderId",order.orderId)
            sendPrintCompletedEvent(order.orderId)
        }
        catch(err)
        {
            console.log(err)
            console.log("printError")
        }
    }
},5000)

socket.on("checkStatusOnPrinter",async(orderId,callback)=>{
    console.log("checkOrderStatus")
    let order = await knex.from(tableName).where("orderId",orderId)
    if(order.length != 0)
    {
        console.log(order)
        let orderStatus = order[0].status
        console.log(orderStatus)
        callback({status:orderStatus})
    }
    else
    {
        callback({status:"notFounded"})
    }
})

function getRandomFileName() {
    var timestamp = new Date().toISOString().replace(/[-:.]/g,"");  
    var random = ("" + Math.random()).substring(2, 8); 
    var random_number = timestamp+random;  
    return random_number;
    }

function getDate(dayOffest)
{
    let yourDate = new Date()
    yourDate.setDate(yourDate.getDate() - dayOffest);
    const offset = yourDate.getTimezoneOffset()
    console.log(offset)
yourDate = new Date(yourDate.getTime() - (offset*60*1000))
return yourDate.toISOString().split('T')[0]
}

