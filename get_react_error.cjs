const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function test() {
  let options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  
  try {
    await driver.get('http://localhost:5173/');
    await driver.sleep(1000);
    // press cmd+k
    await driver.actions().keyDown(Key.COMMAND).sendKeys('k').keyUp(Key.COMMAND).perform();
    await driver.sleep(500);
    // type laptop
    await driver.findElement(By.id('command-palette-input')).sendKeys('laptop', Key.ENTER);
    await driver.sleep(2000);
    
    // click first result
    const results = await driver.findElements(By.css('.w-full.flex.items-center.gap-3.px-5.py-2'));
    if (results.length > 0) {
        await results[0].click();
        await driver.sleep(1000);
    }
    
    // Get logs
    const logs = await driver.manage().logs().get('browser');
    for (let log of logs) {
        console.log(`[${log.level.name}] ${log.message}`);
    }
  } finally {
    await driver.quit();
  }
})();
