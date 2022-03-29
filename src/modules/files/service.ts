import { UploadedFile } from 'express-fileupload';
import { v4 as generateId } from 'uuid';
import { extension } from 'mime-types';
import { prisma } from '../../tools/prismaClient';

export class FileService {

    public static deleteFile = async (id?: number) => {
        if (!id) {
            return undefined;
        }

        // TODO: delete file from storage

        const deletedFile = await prisma.file.delete({
            where: {
                id
            }
        })

        return deletedFile?.id;
    }

    public static saveFile = async (data: UploadedFile, info: string, createdByUserId: number) => {
        const fileHash = generateId();
        const fileExtension = extension(data.mimetype);
        const fileInfo = JSON.parse(info);

        if (!fileExtension) {
            return false;
        }

        // TODO: save file to storage

        const file = await prisma.file.create({
            data: {
                name: data.name,
                size: data.size,
                ext: fileExtension,
                mime: data.mimetype,
                description: fileInfo.description,
                caption: fileInfo.caption,
                url: `/public/${fileHash}.${fileExtension}`,
                creatorId: createdByUserId,
            }
        })

        return file;
    };
}