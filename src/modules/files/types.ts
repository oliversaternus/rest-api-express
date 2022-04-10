export { File } from '@prisma/client';

export type UploadFile = {
    name: string;
    tempFilePath: string;
    mimetype: string;
    size?: number;
}
