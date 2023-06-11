import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';

let browsers = [];
let running = false;

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

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

const testProxy = async (proxy) => {
    const [ip, port, user, pass] = proxy.split(":");
    try {
        const response = await axios.get('http://example.com', {
            proxy: {
                host: ip,
                port: port,
                auth: {
                    username: user,
                    password: pass,
                }
            },
            timeout: 5000,
        });

        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(`Proxy ${ip}:${port} does not support HTTP or is not working. Error: ${error.message}, Status: ${error.response ? error.response.status : 'N/A'}`);
        return false;
    }
}


const StartBot = async (url, numOfBrowsers, headless) => {
    let data = await readFileAsync('./src/backend/proxies.txt', 'utf8');
    let proxies = data.split('\n');

    // const vProxies = [];
    // for (let proxy of proxies) {
    //     const isHttpProxy = await testProxy(proxy);
    //     if (isHttpProxy) {
    //         vProxies.push(proxy);
    //     }
    // }

    // console.log('vProxies:', vProxies);

    // if (vProxies.length === 0) {
    //     throw new Error('No valid proxies found.');
    // }

    // if (numOfBrowsers > vProxies.length) {
    //     throw new Error('The number of browsers exceeds the number of available proxies.');
    // }

    const allPromises = [];

    for (let i = 0; i < numOfBrowsers; i++) {
        // const proxy = vProxies[i % vProxies.length]; // Use proxies in a round-robin fashion
        const proxy = proxies[i % proxies.length]; // Use proxies in a round-robin fashion
        const [ip, port, user, pass] = proxy.split(":"); // Split the proxy into its components
        const headed = headless ? 'new' : false;

        allPromises.push((async () => {
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
                console.log(`Error launching browser: ${error.message}`);
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
                'accept-language': 'en-US,en;q=0.9,en;q=0.8'
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
                console.log(`Error navigating to ${url}`);
                await browser.close();
                return;
            }
            await page.evaluate(() => {
                localStorage.setItem('agreed_to_mature_content', 'true');
                localStorage.setItem('kick_coookie_accepted', 'true');
                localStorage.setItem('kick_video_size', '160p');
            });

            new Promise(r => setTimeout(r, 30000));

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
            console.log(`Browser ${i} started.`)
        })());
    }

    await Promise.all(allPromises);
    running = true;
}

const StopAllBrowsers = async () => {
    await Promise.all(browsers.map(browser => browser.close()));
    browsers = [];
    running = false;
}

const IsRunning = () => running;

export { StartBot, StopAllBrowsers, IsRunning }
