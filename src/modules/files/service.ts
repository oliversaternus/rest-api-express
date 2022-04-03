import { UploadedFile } from 'express-fileupload';
import { v4 as generateId } from 'uuid';
import { extension } from 'mime-types';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from 'fs';

import { prisma } from '../../tools/prismaClient';

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
    deleteFile: async (id: number, userId: number) => {
        if (!id || !userId) {
            return undefined;
        }

        const file = await prisma.file.findFirst({
            where: {
                id,
                creatorId: userId
            }
        });

        if (!file) {
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
    saveFile: async (data: UploadedFile, info: string, userId: number) => {
        const fileHash = generateId();
        const fileExtension = extension(data.mimetype);
        const fileInfo = JSON.parse(info);

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
                size: data.size,
                ext: fileExtension,
                hash: fileHash,
                mime: data.mimetype,
                description: fileInfo.description,
                caption: fileInfo.caption,
                url: publicBucketAddress ? `${publicBucketAddress}/${fileHash}.${fileExtension}` : undefined,
                creatorId: userId,
            }
        })

        return file;
    }
}