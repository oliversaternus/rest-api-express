import { Router } from 'express';
import * as hashJS from "hash.js";

import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';
import { UserRole } from '../authentication/types';
import { prisma } from '../../tools/prismaClient'

export const userRouterFactory = () => Router()

    .get('/',
        autoCatch(
            autoVerifyUser([UserRole.Admin])(
                async (req, res, currentUser, next) => {
                    const users = await prisma.user.findMany({
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            active: true
                        }
                    });
                    res.json({ items: users });
                }
            )
        )
    )

    .get('/me',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const user = await prisma.user.findUnique({
                        where: {
                            id: currentUser.id
                        },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            sessions: true
                        }
                    })
                    res.json(user);
                }
            )
        )
    )

    .get('/:id',
        autoCatch(
            autoVerifyUser([UserRole.Admin])(
                async (req, res, currentUser, next) => {
                    const user = await prisma.user.findUnique({
                        where: {
                            id: Number(req.params.id)
                        },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            sessions: true
                        }
                    })
                    res.json(user);
                }
            )
        )
    )

    .delete('/:id',
        autoCatch(
            autoVerifyUser([UserRole.Admin])(
                async (req, res, currentUser, next) => {

                    // Admin can not delete himself
                    if (currentUser.role === UserRole.Admin && Number(req.params.id) === currentUser.id) {
                        next({ statusCode: 400 });
                        return;
                    }

                    const deletedUser = await prisma.user.delete({
                        where: {
                            id: Number(req.params.id)
                        }
                    })
                    res.json({ deletedId: deletedUser.id });
                }
            )
        )
    )

    .post('/',
        autoCatch(
            autoVerifyUser([UserRole.Admin])(
                async (req, res, currentUser, next) => {
                    const { name, email, password, role, active } = req.body;

                    // QUESTION: Is this validated in runtime?
                    const user = await prisma.user.create({
                        data: {
                            name: String(name),
                            email: String(email),
                            password: String(password),
                            active: Boolean(active),
                            role: role === UserRole.Admin ? UserRole.Admin : UserRole.User
                        }
                    });

                    res.json({ createdId: user.id });
                }
            )
        )
    )

    // change password
    .put('/me/password',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const user = await prisma.user.findUnique({
                        where: {
                            id: currentUser.id
                        }
                    });

                    if (!user) {
                        next({ statusCode: 404 });
                        return;
                    }

                    if (!req.body.newPassword || String(req.body.newPassword).length < 6) {
                        next({ statusCode: 400 });
                        return;
                    }

                    // require current password to update password
                    const currentPWHash = hashJS.sha256().update(req.body.currentPassword).digest("hex");
                    const newPWHash = hashJS.sha256().update(req.body.newPassword).digest("hex");

                    if (user.password !== currentPWHash) {
                        next({ statusCode: 401 });
                        return;
                    }

                    await prisma.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            password: newPWHash
                        }
                    });

                    res.json({ updatedId: user.id });
                }
            )
        )
    )

    // change user data
    .put('/me',
        autoCatch(
            autoVerifyUser()(
                async (req, res, currentUser, next) => {
                    const { name, email } = req.body;

                    const updatedUser = await prisma.user.update({
                        where: {
                            id: currentUser.id
                        },
                        data: {
                            ...(!!name && { name: String(name) }),
                            ...(!!email && { email: String(email) })
                        }
                    })

                    if (!updatedUser) {
                        next({ statusCode: 404 });
                        return;
                    }

                    res.json({ updatedId: updatedUser.id });
                }
            )
        )
    )

    .put('/:id',
        autoCatch(
            autoVerifyUser([UserRole.Admin])(
                async (req, res, currentUser, next) => {
                    const { name, email, role, active } = req.body;

                    const updatedUser = await prisma.user.update({
                        where: {
                            id: currentUser.id
                        },
                        data: {
                            ...(!!name && { name: String(name) }),
                            ...(!!email && { email: String(email) }),
                            ...(active !== undefined && { active: Boolean(active) }),
                            ...(!!role && { role: role === UserRole.Admin ? UserRole.Admin : UserRole.User })
                        }
                    })

                    if (!updatedUser) {
                        next({ statusCode: 404 });
                        return;
                    }

                    res.json({ updatedId: updatedUser.id });
                }
            )
        )
    );
