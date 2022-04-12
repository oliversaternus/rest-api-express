import { marked } from 'marked';
import { toDataURL as generateQrCode } from 'qrcode';

export const resolveSpecialContent = async <T>(object: T, array?: boolean) => {
    const resultObject = array ? [] : {};
    const entries = Object.entries(object);
    for (const [key, value] of entries) {
        if (key.startsWith('html_') && typeof value === 'string') {
            resultObject[key] = marked.parse(value);
        } else if (key.startsWith('qrcode_') && typeof value === 'string') {
            resultObject[key] = `<img src="${await generateQrCode(value)}" />`;
        } else if (Array.isArray(value)) {
            resultObject[key] = await resolveSpecialContent(value, true);
        } else if (value instanceof Object) {
            resultObject[key] = await resolveSpecialContent(value);
        } else {
            resultObject[key] = value;
        }
    }
    return resultObject as T;
};