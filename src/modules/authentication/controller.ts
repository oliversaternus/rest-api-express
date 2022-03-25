import { Router } from 'express';
import autoCatch from '../../tools/autocatch';
import * as jwt from "jsonwebtoken";
import * as hashJS from "hash.js";
import { prisma } from '../../tools/prismaClient';
import { authSecret, autoVerifyRefresh, refreshSecret } from './tools';
import { RefreshContext, UserContext } from './types';

export const authenticationRouterFactory = () => Router()

    .post('/login',
        autoCatch(
            async (req, res, next) => {
                const { username, password } = req.body;
                if (!username || !password) {
                    next({ statusCode: 400 });
                    return;
                }
                const user = await prisma.user.findFirst({
                    where: {
                        email: username,
                        password: hashJS.sha256().update(String(password)).digest("hex")
                    }
                });

                if (!user) {
                    next({ statusCode: 401 });
                    return;
                }

                const session = await prisma.session.create({
                    data: {
                        initiatorIp: req.ip,
                        lastIp: req.ip,
                        initiatorId: user.id
                    }
                });

                const token: string = jwt.sign(
                    { data: { id: user.id, role: user.role } as UserContext },
                    authSecret,
                    { expiresIn: 30 * 60 * 1000 });

                const refreshToken: string = jwt.sign(
                    { data: { id: user.id, role: user.role, sessionId: session.id } as RefreshContext },
                    refreshSecret,
                    { expiresIn: 30 * 24 * 60 * 60 * 1000 });

                res.json({ token, refreshToken });
            }
        )
    )
    .post('/refresh',
        autoCatch(
            autoVerifyRefresh()(
                async (req, res, userRefresh, next) => {
                    const user = await prisma.user.findUnique({
                        where: {
                            id: userRefresh.id
                        }, include: {
                            sessions: true
                        }
                    });

                    const session = user?.sessions.find(item => item.id === userRefresh.sessionId);

                    if (!user || !session) {
                        next({ statusCode: 403 });
                        return;
                    }

                    if (!user.active) {
                        next({ statusCode: 401 });
                        return;
                    }

                    await prisma.session.update({
                        where: {
                            id: session.id
                        },
                        data: {
                            lastIp: req.ip
                        }
                    });

                    const token: string = jwt.sign(
                        { data: { id: user.id, role: user.role } },
                        authSecret,
                        { expiresIn: 30 * 60 * 1000 });

                    res.json({ token });
                }
            )
        )
    )

    .post('/logout',
        autoCatch(
            autoVerifyRefresh()(
                async (req, res, userRefresh, next) => {
                    const session = await prisma.session.findUnique({
                        where: {
                            id: userRefresh.sessionId
                        }
                    });

                    if (!session) {
                        next({ statusCode: 403 });
                        return;
                    }

                    await prisma.session.delete({
                        where: {
                            id: session.id
                        }
                    });

                    res.json({ message: 'logout successfull' });
                }
            )
        )
    )

    .post('/logout/global',
        autoCatch(
            autoVerifyRefresh()(
                async (req, res, userRefresh, next) => {
                    await prisma.session.deleteMany({
                        where: {
                            initiatorId: userRefresh.id
                        }
                    });

                    res.json({ message: 'all sessions closed' });
                }
            )
        )
    );
