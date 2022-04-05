const { unlinkSync, renameSync, existsSync } = require('fs');
const { join } = require('path');

const testDbPath = join(__dirname, '../', 'prisma', 'test.db');
const testDbJournalPath = join(__dirname, '../', 'prisma', 'test.db-journal');
const prismaEnvPath = join(__dirname, '../', 'prisma', '.env');
const tempPrismaEnvPath = join(__dirname, '../', 'prisma', 'temp.env');

if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
}
if (existsSync(testDbJournalPath)) {
    unlinkSync(testDbJournalPath);
}
if (existsSync(tempPrismaEnvPath)) {
    renameSync(tempPrismaEnvPath, prismaEnvPath);
}
unlinkSync(prismaEnvPath);