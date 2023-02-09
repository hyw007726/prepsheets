import * as functions from 'firebase-functions';
import { promises as fsPromises } from 'fs';
import puppeteer from 'puppeteer';


export const getSyscoCategoryLinks= functions
  .region('europe-west2')
  .https.onRequest(async (req, res) => {
     
    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto('https://order.syscoireland.com/');
    await page.waitForTimeout(2000);
    await page.evaluate(() =>{
      const el= <HTMLElement>document.getElementsByClassName('action nav-toggle')[0];
     el.click();
    });
    await page.waitForTimeout(2000);
    
  const list = await page.evaluateHandle(() =>document.querySelectorAll("[class='ui-corner-all']"));
  const result = await page.evaluateHandle((list)=>{
    var str=""
    list.forEach((ele)=>{
      var href=ele.getAttribute("href");
      // var category=href?.split("/")[7];
      str+=href+",";
    })
    return str;
  },list)
      // const testConst=await page.content();
      // await console.log(testConst);
      await browser.close();
      // await res.send(testConst);
      return result.jsonValue();
    })().then((x)=>{
      // var arr = (x as string).split(",");
      res.json(x);
    }).catch(err => err);

  
  });


const string = ""; // from categoris.txt
const obj=JSON.parse(string);
export const getProductLinksFromCategories = functions
  .region("europe-west2")
  .https.onRequest(async (req, res) => {
    //initialize Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setDefaultTimeout(540000);
    page.on("requestfailed", (request) => {
      console.log(request.url() + "" + request?.failure()?.errorText);
    });
    //start iterating through categories links
    for (var c in obj) {
      try {
        var categoryUrl = obj[c];
        await page.goto(categoryUrl);
        var hrefs = await page.evaluate(() => {
          //Get first page links
          var links = document.querySelectorAll("[class='product-item-link']");
          var hrefs = "";
          if (links == null) {
            return hrefs;
          }
          links.forEach((link) => {
            var href = link.getAttribute("href") + ",";
            hrefs += href;
          });
          return hrefs;
        });
        //get total page number
        await fsPromises.writeFile(c + ".txt", hrefs + " ", { flag: "a+" });
        let pages = await page.evaluate(() => {
          var elements = document.querySelectorAll("[class=‘toolbar-number’]");
          if (elements != null) {
            var number = elements[0].innerHTML;
            return Math.ceil(Number(number) / 32);
          }
          return 0;
        });
        //get links on the rest of pages
        if (pages && pages > 1) {
          for (var pageIndex = 2; pageIndex <= pages; pageIndex++) {
            await page.goto(categoryUrl + "?p=" + pageIndex);
            let hrefs = await page.evaluate(() => {
              var links = document.querySelectorAll(
                "[class=‘product-item-link’]"
              );
              var inside = "";
              links.forEach((link) => {
                var href = link.getAttribute("href") + ",";
                inside += href;
              });
              return inside;
            });
            await fsPromises.writeFile(c + ".txt", hrefs, { flag: "a+" });
          }
        }
      } catch (error) {
        console.log(error);
        continue;
      }
    }
    await browser.close();
  });
