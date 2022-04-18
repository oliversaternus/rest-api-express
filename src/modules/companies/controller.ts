import { Router } from 'express';

import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';
import { UserRole } from '../authentication/types';
import { prisma } from '../../tools/prismaClient'
import { Prisma } from '@prisma/client';
import { v4 as generateId } from 'uuid';

export const userRouterFactory = () => Router()

    .get('/',
        autoCatch(
            autoVerifyUser([UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const { skip, limit, where = {}, orderBy } = req.query;
                    const companies = await prisma.company.findMany({
                        orderBy: orderBy as Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>,
                        where: {
                            ...(where as Prisma.FileWhereInput)
                        },
                        skip: Number(skip || 0),
                        take: Number(limit || 24)
                    });
                    res.json({ items: companies });
                }
            )
        )
    )

    .get('/:id',
        autoCatch(
            autoVerifyUser([UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const company = await prisma.company.findUnique({
                        where: {
                            id: Number(req.params.id)
                        }
                    })
                    res.json(company);
                }
            )
        )
    )

    .put('/:id',
        autoCatch(
            autoVerifyUser([UserRole.Superadmin])(
                async (req, res, currentUser, next) => {
                    const { name, confirmed, active } = req.body;

                    const updatedCompany = await prisma.company.update({
                        where: {
                            id: currentUser.id
                        },
                        data: {
                            ...(!!name && { name: String(name) }),
                            ...(active !== undefined && { active: Boolean(active) }),
                            ...(confirmed !== undefined && { confirmed: Boolean(confirmed) })
                        }
                    })

                    if (!updatedCompany) {
                        next({ statusCode: 404 });
                        return;
                    }

                    res.json({ updatedId: updatedCompany.id });
                }
            )
        )
    )
    
    // register new company
    .post('/',
        autoCatch(
            async (req, res, next) => {
                const {name, email} = req.body;

                if(!name || !email){
                    next({ statusCode: 400 });
                    return;
                }

                const existingUser = await prisma.user.findFirst({
                    where: {
                        email: String(email)
                    }
                });

                if(existingUser){
                    next({ statusCode: 409 });
                    return;
                }

                const companyConfirmationRequest = await prisma.companyConfirmation.create({
                    data: {
                        name,
                        email,
                        token: generateId()
                    }
                })

                res.json(companyConfirmationRequest);
            }
        )
    )
    
    // confirm new company
    .post('/:token',
        autoCatch(
            async (req, res, next) => {
                const {token} = req.params;

                if(!token){
                    next({ statusCode: 400 });
                    return;
                }

                const confirmation = await prisma.companyConfirmation.findFirst({
                    where: {
                        token: String(token)
                    }
                });

                if(!confirmation){
                    next({ statusCode: 404 });
                    return;
                }

                const existingUser = await prisma.user.findFirst({
                    where: {
                        email: String(confirmation.email)
                    }
                });

                if(existingUser){
                    next({ statusCode: 409 });
                    return;
                }

                // TODO: create company and admin user + delete confirmations

                res.json();
            }
        )
    );
