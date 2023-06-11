import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

const readFileAsync = promisify(fs.readFile);
const userAgents = [
    // Google Chrome
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',

    // Firefox
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:50.0) Gecko/20100101 Firefox/50.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0',

    // Safari
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',

    // Internet Explorer
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',

    // Edge
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',

    // // iOS (iPhone)
    // 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.23 (KHTML, like Gecko) Version/10.0 Mobile/14E5239e Safari/602.1',

    // // Android
    // 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36',
];
let browsers = [];
let running = false;

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const testProxy = async (proxy) => {
  const [ip, port, user, pass] = proxy.split(":");
  try {
    const response = await axios.get('http://example.com', {
      proxy: {
        host: ip,
        port,
        auth: {
          username: user,
          password: pass,
        },
      },
      timeout: 5000,
    });

    return response.status === 200;
  } catch (error) {
    console.error(`Proxy ${ip}:${port} is not working or does not support HTTP.`, error);
    return false;
  }
};

const createBot = async (url, proxy, headless) => {
  const [ip, port, user, pass] = proxy.split(":");
  const headed = headless ? 'new' : false;

  // Bot implementation...
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: headed,
      args: [
        `--proxy-server=http://${ip}:${port}`,
        `--no-sandbox`,
        `--disable-setuid-sandbox`,
        `--disable-infobars`,
        `--window-position=0,0`,
        `--ignore-certifcate-errors`,
        `--ignore-certifcate-errors-spki-list`,
        `--mute-audio`,
      ],
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    });
  } catch (error) {
    console.error('Error launching browser:', error);
    return;
  }

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setViewport({ width: 800, height: 600 });
  await page.setExtraHTTPHeaders({
    'user-agent': randomUserAgent,
    'upgrade-insecure-requests': '1',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,en;q=0.8',
  });

  // Authenticate the proxy
  await page.authenticate({
    username: user,
    password: pass,
  });

  // Navigate to the page
  try {
    await page.goto(url, { timeout: 30000 });
  } catch {
    console.error(`Error navigating to ${url}`);
    await browser.close();
    return;
  }

  await page.evaluate(() => {
    localStorage.setItem('agreed_to_mature_content', 'true');
    localStorage.setItem('kick_coookie_accepted', 'true');
    localStorage.setItem('kick_video_size', '160p');
  });

  await new Promise(r => setTimeout(r, 30000));

  // Click a button
  try {
    await page.waitForSelector('.variant-action.size-sm', { timeout: 5000 });
    const button = await page.$('.variant-action.size-sm');
    if (button) {
      await button.click();
    }
  } catch (error) {
    console.log("Button '.variant-action.size-sm' not found, skipping...");
  }

  try {
    await page.waitForSelector('.kick-icon-theater', { timeout: 10000 });
    const button = await page.$('.kick-icon-theater');
    if (button) {
      await button.click();
    }
  } catch (error) {
    console.log("Button '.kick-icon-theater' not found, skipping...");
  }

  // Store the browser instance in the browsers array instead of closing it
  browsers.push(browser);
};

const startBot = async (url, numOfBrowsers, headless) => {
  const data = await readFileAsync('./src/backend/proxies.txt', 'utf8');
  const proxies = data.split('\n');
  const allPromises = [];

  for (let i = 0; i < numOfBrowsers; i++) {
    const proxy = proxies[i % proxies.length]; // Use proxies in a round-robin fashion
    allPromises.push(createBot(url, proxy, headless));
  }

  await Promise.all(allPromises);
  running = true;
};

const stopAllBrowsers = async () => {
  await Promise.all(browsers.map(browser => browser.close()));
  browsers = [];
  running = false;
};

const isRunning = () => running;

export { startBot, stopAllBrowsers, isRunning };
