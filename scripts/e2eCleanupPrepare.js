const { unlinkSync, renameSync, existsSync } = require('fs');
const { join } = require('path');

const prismaEnvPath = join(__dirname, '../', 'prisma', '.env');
const tempPrismaEnvPath = join(__dirname, '../', 'prisma', 'temp.env');

unlinkSync(prismaEnvPath);
renameSync(tempPrismaEnvPath, prismaEnvPath);