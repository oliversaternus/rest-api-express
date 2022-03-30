import { Router } from 'express';
import { UploadedFile } from 'express-fileupload';

import { FileService } from './service';

import { prisma } from '../../tools/prismaClient';
import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';

export const fileRouterFactory = () => Router()

    .get('/',
        autoCatch(
            autoVerifyUser()(
                async (req, res) => {
                    const files = prisma.file.findMany();
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

                    const formattedFile = await FileService.saveFile(data, info, currentUser.id);

                    res.status(200).json(formattedFile);
                }
            )
        )
    );