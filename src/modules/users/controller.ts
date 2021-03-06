import { Router } from 'express';
import * as hashJS from "hash.js";

import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';
import { UserRole } from '../authentication/types';
import { prisma } from '../../tools/prismaClient'
import { Prisma } from '@prisma/client';

export const userRouterFactory = () => Router()

    .get('/',
        autoCatch(
            autoVerifyUser([UserRole.Admin, UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const { skip, limit, where = {}, orderBy = [] } = req.query;
                    const users = await prisma.user.findMany({
                        orderBy: orderBy as Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>,
                        where: {
                            ...(where as Prisma.UserWhereInput),
                            password: undefined,
                            companyId: currentUser.companyId
                        },
                        skip: Number(skip || 0),
                        take: Number(limit || 24),
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
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
                            firstName: true,
                            lastName: true,
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
            autoVerifyUser([UserRole.Admin, UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const user = await prisma.user.findFirst({
                        where: {
                            id: String(req.params.id),
                            companyId: currentUser.companyId
                        },
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            sessions: true
                        }
                    })
                    res.json(user);
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
            autoVerifyUser([UserRole.Admin, UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const { name, email, role, active } = req.body;
                    const userId = req.params.id;

                    if (!userId) {
                        next({ statusCode: 400 });
                        return;
                    }

                    const updatedUser = await prisma.user.updateMany({
                        where: {
                            id: String(userId),
                            companyId: currentUser.companyId
                        },
                        data: {
                            ...(!!name && { name: String(name) }),
                            ...(!!email && { email: String(email) }),
                            ...(active !== undefined && { active: Boolean(active) }),
                            ...(!!role && { role: role === UserRole.Admin ? UserRole.Admin : UserRole.User })
                        }
                    })

                    if (!updatedUser.count) {
                        next({ statusCode: 404 });
                        return;
                    }

                    res.json({ updatedId: userId });
                }
            )
        )
    );
