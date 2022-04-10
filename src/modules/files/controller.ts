import { Router } from 'express';
import { UploadedFile } from 'express-fileupload';

import { FileService } from './service';

import { prisma } from '../../tools/prismaClient';
import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';
import { Prisma } from '@prisma/client';

export const fileRouterFactory = () => Router()

    .get('/',
        autoCatch(
            autoVerifyUser()(
                async (req, res) => {
                    const { skip, limit, where, orderBy } = req.query;
                    const files = await prisma.file.findMany({
                        orderBy: orderBy as Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>,
                        where: where as Prisma.FileWhereInput,
                        skip: Number(skip || 0),
                        take: Number(limit || 24),
                    });
                    res.status(200).json({ items: files });
                }
            )
        )
    )

    .get('/:id',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const file = await prisma.file.findUnique({
                        where: {
                            id: Number(req.params.id)
                        }
                    })
                    file ? res.json(file) : res.status(201).send();
                }
            )
        )
    )

    .delete('/:id',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const deletedId = await FileService.deleteFile(Number(req.params.id));
                    res.status(200).json({ deletedId });
                }
            )
        )
    )

    .put('/:id',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const { caption, description } = req.body;

                    const updatedFile = await prisma.file.update({
                        where: {
                            id: Number(req.params.id)
                        },
                        data: {
                            ...(caption && { caption }),
                            ...(description && { description })
                        }
                    })

                    if (!updatedFile) {
                        next({ statusCode: 404 });
                        return;
                    }

                    res.status(200).json(updatedFile);
                }
            )
        )
    )

    .post('/',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const data = req.files?.data as UploadedFile | undefined;
                    const info = req.body.info;

                    if (!data || !info) {
                        next({ statusCode: 400, message: 'keys "data" and "info" need to be provided' });
                        return;
                    }

                    const { description, caption } = JSON.parse(info) || {};
                    const file = await FileService.saveFile(data, currentUser.id, description, caption);

                    if (!file) {
                        next({ statusCode: 500, message: 'File could not be saved' });
                        return;
                    }

                    res.status(200).json(file);
                }
            )
        )
    );