import { Router } from 'express';
import autoCatch from '../../tools/autocatch';
import * as jwt from "jsonwebtoken";
// import * as hashJS from "hash.js";
import { prisma } from '../../tools/prismaClient';

const authSecret = 'a3163b2c60d5fde24df81289f87d';
const refreshSecret = '67a44555ae2f8a972fb7192d88be';

export const authenticationRouterFactory = () => Router()

    .post('/login',
        autoCatch(
            async (req, res, next) => {
                const { username, password } = req.body;
                if (!username || !password) {
                    next({ statusCode: 400 });
                    return;
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email: username
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
                    { data: { id: user.id, admin: user.admin } },
                    authSecret,
                    { expiresIn: 30 * 60 * 1000 });

                const refreshToken: string = jwt.sign(
                    { data: { id: user.id, admin: user.admin, sessionId: session.id } },
                    refreshSecret,
                    { expiresIn: 30 * 24 * 60 * 60 * 1000 });

                res.json({ token, refreshToken });
            }
        )
    )
