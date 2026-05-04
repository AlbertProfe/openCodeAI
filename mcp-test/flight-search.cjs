const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/', { waitUntil: 'networkidle0', timeout: 30000 });
  console.log('Page loaded');

  // Evaluate JS to fill form
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, combobox');
    for (const input of inputs) {
      const wrapper = input.closest('div') || input.parentElement;
      const label = wrapper?.previousElementSibling?.textContent || input.getAttribute('aria-label') || '';
      if (label.includes('Origin')) input.value = 'BCN';
      if (label.includes('Destination')) input.value = 'RIO';
    }
    const passInputs = document.querySelectorAll('input[type="number"], spinbutton');
    for (const input of passInputs) {
      if (input.value === '1') input.value = '2';
    }
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Search'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('RESULTS:\n', text.slice(0, 4000));
  await browser.close();
})();
