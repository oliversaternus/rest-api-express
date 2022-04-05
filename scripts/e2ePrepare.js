const { unlinkSync, renameSync, existsSync, writeFileSync } = require('fs');
const { join } = require('path');

const prismaEnvPath = join(__dirname, '../', 'prisma', '.env');
const tempPrismaEnvPath = join(__dirname, '../', 'prisma', 'temp.env');
const testDbPath = join(__dirname, '../', 'prisma', 'test.db');
const testDbJournalPath = join(__dirname, '../', 'prisma', 'test.db-journal');
const migrationsFolder = join(__dirname, '../', 'prisma', 'migrations');
const tempMigrationsFolder = join(__dirname, '../', 'prisma', 'temp-migrations');

// eventually delete existing test files
if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
}
if (existsSync(testDbJournalPath)) {
    unlinkSync(testDbJournalPath);
}

// temporarily rename prisma relevant files
if (existsSync(migrationsFolder)) {
    renameSync(migrationsFolder, tempMigrationsFolder);
}
if (existsSync(prismaEnvPath)) {
    renameSync(prismaEnvPath, tempPrismaEnvPath);
}

writeFileSync(prismaEnvPath, 'DATABASE_URL=file:./test.db');