import puppeteer, { Browser, Page } from 'puppeteer';
import { TemplateKeys, TemplateProps } from "./types";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import { marked } from 'marked';

let browser: Browser;
let page: Page;
let templates: Partial<{ [key in TemplateKeys]: handlebars.TemplateDelegate<TemplateProps[key]> }> = {};

const renderMarkdown = <T>(object: T, array?: boolean) => {
    const resultObject = array ? [] : {};
    const entries = Object.entries(object);
    for (const [key, value] of entries) {
        if (key.startsWith('html_') && typeof value === 'string') {
            resultObject[key] = marked.parse(value);
        } else if (Array.isArray(value)) {
            resultObject[key] = renderMarkdown(value, true);
        } else if (value instanceof Object) {
            resultObject[key] = renderMarkdown(value);
        } else {
            resultObject[key] = value;
        }
    }
    return resultObject as T;
};

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
    generatePDF: async <TemplateKey extends TemplateKeys>(template: TemplateKey, props: TemplateProps[TemplateKey]) => {
        try {
            const htmlContent = templates[template]?.(renderMarkdown(props) as any);
            if (!htmlContent) {
                return;
            }
            await page.goto(`data:text/html,${htmlContent}`, {
                waitUntil: ['domcontentloaded', 'load', 'networkidle0'],
            });
            await page.pdf({ path: 'hn.pdf', format: 'a4' });
        } catch (e) { }
    }
}