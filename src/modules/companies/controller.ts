import { Router } from 'express';

import autoCatch from '../../tools/autocatch';
import { autoVerifyUser } from '../authentication/tools';
import { UserRole } from '../authentication/types';
import { prisma } from '../../tools/prismaClient'
import { Prisma } from '@prisma/client';
import { v4 as generateId } from 'uuid';
import { EmailService } from '../email/service';
import hashJS from "hash.js";

const hostUrl = process.env.HOST;
const imprintCompanyName = process.env.IMPRINT_COMPANY_NAME;
const imprintCompanyUrl = process.env.IMPRINT_COMPANY_URL;
const imprintCompanyAddress = process.env.IMPRINT_COMPANY_ADDRESS;
const redirectUrl = process.env.COMPANY_CREATED_REDIRECT_URL;

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
                            id: String(req.params.id)
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
                const {companyName, userFirstName, userLastName, userPassword, email} = req.body;

                if(!companyName || !email){
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

                const existingConfirmation = await prisma.companyConfirmation.findFirst({
                    where: {
                        email: String(email)
                    }
                });

                // if company is already in registration process, only resend email
                if(existingConfirmation){
                    // TODO: Use new company verification template
                    const resendResult = await EmailService.sendEmail('ACCOUNT_VERIFICATION', {
                        title: 'Verify your account',
                        user: `${existingConfirmation.userFirstName} ${existingConfirmation.userLastName}`,
                        verificationLink: `${hostUrl}/companies/confirmation/${existingConfirmation.token}`,
                        senderUrl: imprintCompanyUrl || '',
                        senderCompanyName: imprintCompanyName || '',
                        senderCompanyAddress: imprintCompanyAddress || ''
                    }, 'Verify your account', existingConfirmation.email);

                    if(!resendResult){
                        next({ statusCode: 500 });
                        return;
                    }
    
                    res.sendStatus(200);
                    return;
                }

                // create new confirmation request

                const confirmationToken = generateId();
                const companyConfirmationRequest = await prisma.companyConfirmation.create({
                    data: {
                        companyName: String(companyName),
                        userFirstName: String(userFirstName),
                        userLastName: String(userLastName),
                        userPassword: hashJS.sha256().update(String(userPassword)).digest("hex"),
                        email: String(email),
                        token: confirmationToken
                    }
                });

                // TODO: Use new company verification template
                const sendResult = await EmailService.sendEmail('ACCOUNT_VERIFICATION', {
                    title: 'Verify your account',
                    user: `${userFirstName} ${userLastName}`,
                    verificationLink: `${hostUrl}/companies/confirmation/${confirmationToken}`,
                    senderUrl: imprintCompanyUrl || '',
                    senderCompanyName: imprintCompanyName || '',
                    senderCompanyAddress: imprintCompanyAddress || ''
                }, 'Verify your account', email);

                if(!sendResult){
                    next({ statusCode: 500 });
                    return;
                }

                res.json(companyConfirmationRequest);
            }
        )
    )
    
    // confirm new company
    // this is a get to be easily accessible from anchor tags in the verification email
    .get('/confirmation/:token',
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

                const company = await prisma.company.create({
                    data: {
                        name: confirmation.companyName
                    }
                });

                const admin = await prisma.user.create({
                    data: {
                        firstName: confirmation.userFirstName,
                        lastName: confirmation.userLastName,
                        email: confirmation.email,
                        password: confirmation.userPassword,
                        companyId: company.id,
                        role: UserRole.Admin
                    }
                });

                const deleteResult = await prisma.companyConfirmation.deleteMany({
                    where: {
                        email: confirmation.email
                    }
                });

                if(!company || !admin || !deleteResult.count){
                    next({ statusCode: 500 });
                    return;
                }

                res.redirect(redirectUrl || '');
            }
        )
    );
