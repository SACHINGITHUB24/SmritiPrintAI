const express = require('express')
const app = express()
const puppeteer = require('puppeteer');

app.set('view engine', 'ejs')

app.use(express.static('public'))

// top-level function to scrape tenders and return an array
async function scrapeTenders() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://eprocure.gov.in/eprocure/app', { waitUntil: 'networkidle2',timeout: 45_000 });

  // wait until the tender tables are rendered
  await page.waitForSelector('#activeTenders tr');

  const tenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#activeTenders tbody tr'))
      .map(tr => {
        const a = tr.querySelector('a.link2');
        const tds = tr.querySelectorAll('td');
        return {
          title: a?.textContent.trim() || '',
          detailLink: a?.href || '',
          referenceNo: tds[1]?.textContent.trim(),
          closingDate: tds[2]?.textContent.trim(),
          openingDate: tds[3]?.textContent.trim()
        };
      })
  );

  await browser.close();
  return tenders;
}

// root redirects to the tenders page
app.get('/', function(req, res) {
  res.redirect('/tenders');
});

// render the tenders page with fetched data
app.get('/tenders', async function(req,res) {
  try {
    const tenders = await scrapeTenders();
    res.render('tenders', { tenders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tenders');
  }
});

app.listen(3000, function(){
  console.log("Scraping Tenders Please Wait from https://eprocure.gov.in/eprocure/app")
})