import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser;
let page: Page;

export const init = async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
};

export const close = async () => {
    await browser.close();
}

export const DocumentGeneratorService = {
    generatePDF: async () => {
        try {
            await page.goto('https://news.ycombinator.com', {
                waitUntil: 'networkidle0',
            });
            await page.pdf({ path: 'hn.pdf', format: 'a4' });
        } catch (e) { }
    }
}