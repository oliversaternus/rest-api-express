import { v4 as generateId } from 'uuid';
import { extension } from 'mime-types';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream, promises as fs } from 'fs';

import { prisma } from '../../tools/prismaClient';
import { UploadFile } from './types';

const s3Bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretKey = process.env.S3_SECRET_KEY;
const forcePathStyle = !!process.env.S3_FORCE_PATH_STYLE;
const publicBucketAddress = process.env.S3_PUBLIC_BUCKET_ADDRESS;

const credentials = {
    accessKeyId: String(s3AccessKey),
    secretAccessKey: String(s3SecretKey)
}

const s3Client = new S3Client({ region, endpoint, credentials, forcePathStyle });

export const FileService = {
    deleteFile: async (id: number, companyId: number) => {
        if (!id) {
            return undefined;
        }

        const file = await prisma.file.findUnique({
            where: {
                id
            }
        });

        if (!file || file.companyId !== companyId) {
            return undefined;
        }

        const deleteResponse = await s3Client.send(new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: `${file.hash}.${file.ext}`,
        }));

        const deleteStatus = Number(deleteResponse.$metadata.httpStatusCode);

        if (!(deleteStatus >= 200 && deleteStatus < 300)) {
            return undefined;
        }

        const deletedFile = await prisma.file.delete({
            where: {
                id
            }
        })

        return deletedFile?.id;
    },
    saveFile: async (data: UploadFile, userId: number, companyId: number, description: string = '', caption: string = '') => {
        const fileHash = generateId();
        const fileExtension = extension(data.mimetype);
        const fileSize = data.size || (await fs.stat(data.tempFilePath))?.size * (1024 * 1024);

        if (!fileExtension) {
            return undefined;
        }

        const fileStream = createReadStream(data.tempFilePath);

        const putResponse = await s3Client.send(new PutObjectCommand({
            Bucket: s3Bucket,
            Key: `${fileHash}.${fileExtension}`,
            Body: fileStream
        }));

        const putStatus = Number(putResponse.$metadata.httpStatusCode);

        if (!(putStatus >= 200 && putStatus < 300)) {
            return undefined;
        }

        const file = await prisma.file.create({
            data: {
                name: data.name,
                size: fileSize,
                ext: fileExtension,
                hash: fileHash,
                mime: data.mimetype,
                description,
                caption,
                url: publicBucketAddress ? `${publicBucketAddress}/${fileHash}.${fileExtension}` : undefined,
                creatorId: userId,
                companyId
            }
        })

        return file;
    }
}