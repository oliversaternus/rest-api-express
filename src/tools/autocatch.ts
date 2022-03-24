import { Request, Response, NextFunction } from "express";
export default function autoCatch(input: (req: Request, res: Response, next: NextFunction) => Promise<void>):
(req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req, res, next) => {
        try {
            await input(req, res, next);
        } catch (e) {
            console.log(e);
            next({ statusCode: 500 });
        }
    };
}