const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  console.log('Visiting localhost:3000/login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  console.log('Done visiting /login.');

  console.log('Visiting localhost:3000/client-dashboard...');
  await page.goto('http://localhost:3000/client-dashboard', { waitUntil: 'networkidle2' });
  console.log('Done visiting /client-dashboard.');

  await browser.close();
})();
