import fs from "fs";
import handlebars from "handlebars";
import nodemailer from "nodemailer";
import path from "path";
import { TemplateKeys, TemplateProps } from "./types";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpEmailAddress = process.env.SMTP_EMAIL_ADDRESS || smtpUser;

const mailTransporter = nodemailer.createTransport({
    auth: {
        pass: String(smtpPassword),
        user: String(smtpUser)
    },
    secure: true,
    host: smtpHost,
    port: Number(smtpPort)
});

const templates: Partial<{ [key in TemplateKeys]: handlebars.TemplateDelegate<TemplateProps[key]> }> = {};

const templateFiles = fs.readdirSync(path.join(__dirname, "/templates"));
templateFiles.forEach((fileName) => {
    const templateString: string = fs.readFileSync(
        path.join(__dirname, "/templates", fileName), "utf-8");
    const template = handlebars.compile(templateString);
    templates[fileName.split(".")[0] as TemplateKeys] = template;
});

export const EmailService = {
    sendEmail: async <TemplateKey extends TemplateKeys>(template: TemplateKey, props: TemplateProps[TemplateKey], subject: string, recipient: string) => {
        const htmlContent = templates[template]?.(props);
        if (!htmlContent) {
            return;
        }
        try {
            const sentMessageInfo = await mailTransporter.sendMail({
                from: smtpEmailAddress,
                html: htmlContent,
                subject,
                to: recipient
            });
            return sentMessageInfo;
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }
};