import puppeteer, { Browser, Page } from 'puppeteer';
import { TemplateKeys, TemplateProps } from "./types";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import queue from 'queue';
import { FileService } from '../files/service';
import { UploadedFile } from 'express-fileupload';
import { v4 as generateId } from 'uuid';
import { File } from '../files/types';
import { resolveSpecialContent } from './tools';

let browser: Browser;
let page: Page;
let templates: Partial<{ [key in TemplateKeys]: handlebars.TemplateDelegate<TemplateProps[key]> }> = {};
let tasks: queue;

export const init = async () => {
    templates = {};
    const templateFiles = fs.readdirSync(path.join(__dirname, "/templates"));
    templateFiles.forEach((fileName) => {
        const templateString: string = fs.readFileSync(
            path.join(__dirname, "/templates", fileName), "utf-8");
        const template = handlebars.compile(templateString);
        templates[fileName.split(".")[0] as TemplateKeys] = template;
    });

    browser = await puppeteer.launch();
    page = await browser.newPage();
    tasks = queue({ autostart: true, concurrency: 1 });
};

export const close = async () => {
    await browser.close();
}

export const DocumentGeneratorService = {
    generatePDF: async <TemplateKey extends TemplateKeys>(template: TemplateKey, props: TemplateProps[TemplateKey], userId: string, companyId: string): Promise<File | undefined> => {
        return new Promise((resolve, reject) => {
            tasks.push(async () => {
                try {
                    const resolvedProps = await resolveSpecialContent(props);
                    const htmlContent = templates[template]?.(resolvedProps as any);
                    if (!htmlContent) {
                        return;
                    }
                    const tempId = generateId();
                    const tempPath = path.join(__dirname, '../', '../', '../', 'tmp', tempId);

                    await page.setContent(htmlContent, {
                        waitUntil: ['domcontentloaded', 'load', 'networkidle0'],
                    });
                    await page.emulateMediaType('screen');
                    await page.pdf({ path: tempPath, format: 'a4' });
                    const savedFile = await FileService.saveFile(
                        {
                            name: `${template}.pdf`,
                            mimetype: 'application/pdf',
                            tempFilePath: tempPath
                        } as UploadedFile,
                        userId,
                        companyId
                    );
                    resolve(savedFile);
                } catch (e) {
                    console.error(e);
                    resolve(undefined);
                }
            });
        })
    }
}
