import puppeteer, { Browser, Page } from 'puppeteer';
import { TemplateKeys, TemplateProps } from "./types";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";

let browser: Browser;
let page: Page;
let templates: Partial<{ [key in TemplateKeys]: handlebars.TemplateDelegate<TemplateProps[key]> }> = {}

export const init = async () => {
    const templateFiles = fs.readdirSync(path.join(__dirname, "/templates"));
    templateFiles.forEach((fileName) => {
        const templateString: string = fs.readFileSync(
            path.join(__dirname, "/templates", fileName), "utf-8");
        const template = handlebars.compile(templateString);
        templates[fileName.split(".")[0] as TemplateKeys] = template;
    });

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