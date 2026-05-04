import { chromium } from 'puppeteer';

const browser = await chromium.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = await browser.pages();
const page = pages[0] || await browser.newPage();

await page.goto('https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/', { waitUntil: 'networkidle0', timeout: 30000 });

// Fill form by finding inputs
const inputs = await page.$$('input, combobox');
for (const input of inputs) {
  const label = await input.evaluate(el => {
    const prev = el.previousElementSibling;
    return prev?.textContent || el.getAttribute('placeholder') || el.getAttribute('name') || '';
  });
  if (label.toLowerCase().includes('origin')) { await input.click(); await input.type('BCN', { delay: 50 }); }
  if (label.toLowerCase().includes('destination')) { await input.click(); await input.type('RIO', { delay: 50 }); }
  if (label.toLowerCase().includes('passenger')) { await input.click(); await input.type('2', { delay: 50 }); }
}

// Click search button
const buttons = await page.$$('button');
for (const btn of buttons) {
  const text = await btn.evaluate(el => el.textContent);
  if (text.toLowerCase().includes('search')) { await btn.click(); console.log('Clicked search'); }
}

await page.waitForTimeout(3000);

// Get results
const html = await page.content();
console.log('Page loaded, checking results...');
const results = await page.evaluate(() => {
  const els = document.querySelectorAll('button, statictext, [class*="flight"]');
  return Array.from(els).slice(0,30).map(e => e.textContent).join('\n');
});
console.log(results);
await browser.close();
