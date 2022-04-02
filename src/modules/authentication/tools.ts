import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import hashJS from "hash.js";

import { UserRole, UserContext, RefreshContext } from "./types";

const baseSecret = 'a3163b2c60d5fde24df81289f87d';

export const authSecret = hashJS.sha256().update(baseSecret).digest("hex");
export const refreshSecret = hashJS.sha256().update(authSecret).digest("hex")

export const decryptUser = (token: string): UserContext | undefined => {
    try {
        const decrypted: any = jwt.verify(token, authSecret);
        return decrypted.data as UserContext;
    } catch (e) {
        return undefined;
    }
};

export const decryptRefresh = (token: string): RefreshContext | undefined => {
    try {
        const decrypted: any = jwt.verify(token, refreshSecret);
        return decrypted.data as RefreshContext;
    } catch (e) {
        return undefined;
    }
};

export const autoVerifyUser = (roles?: UserRole[]) => (input: (req: Request, res: Response, user: UserContext, next: NextFunction) => Promise<void>):
(req: Request, res: Response, next: NextFunction) => Promise<void> => {
    return async (req, res, next) => {
        const token = req.get("Authorization");
        const user = token && decryptUser(token);
        if (!user) {
            next({ statusCode: 401 })
            return;
        }
        if (roles?.length && !roles.includes(user.role)) {
            next({ statusCode: 403 })
            return;
        }
        await input(req, res, user, next);
    };
}

export const autoVerifyRefresh = () => (input: (req: Request, res: Response, userRefresh: RefreshContext, next: NextFunction) => Promise<void>):
(req: Request, res: Response, next: NextFunction) => Promise<void> => {
    return async (req, res, next) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            next({ statusCode: 401 });
            return;
        }
        const userRefresh = decryptRefresh(refreshToken);
        if (!userRefresh) {
            next({ statusCode: 403 });
            return;
        }
        await input(req, res, userRefresh, next);
    };
}