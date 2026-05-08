const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    executablePath: '/usr/bin/google-chrome'
  });
  const page = await browser.newPage();

  await page.goto('https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/', { waitUntil: 'networkidle0', timeout: 30000 });
  console.log('Page loaded');

  await page.type('#origin', 'BCN');
  await page.type('#destination', 'RIO');
  await page.type('#passengers', '2');
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Search'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));

  const flights = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('.flight-card');
    for (const card of cards) {
      const airline = card.querySelector('.airline')?.textContent?.trim();
      const price = card.querySelector('.price')?.textContent?.replace('$', '')?.trim();
      const stops = card.querySelector('.stops')?.textContent?.trim() || '?';
      if (airline && price) results.push({ airline, price: parseInt(price), stops });
    }
    return results;
  });
  
  const sorted = flights.sort((a, b) => a.price - b.price);
  const stopLabels = { '0 stops': 0, '1 stop': 1, '2 stops': 2, '?': 99 };
  console.log('\n=== FLIGHT SUMMARY ===');
  console.log(`Route: BCN → RIO | 2 passengers`);
  console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);
  console.log('#  Airline             Price   Stops');
  console.log('-- ------------------- ------- -----');
  sorted.forEach((f, i) => {
    const stopNum = stopLabels[f.stops] ?? 99;
    console.log(`${(i+1).toString().padStart(2)}  ${f.airline.padEnd(17)} $${f.price.toString().padStart(5)}   ${f.stops}`);
  });
  console.log(`\nTotal flights: ${sorted.length}`);
  
  await browser.close();
})();
