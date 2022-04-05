const { unlinkSync, renameSync, existsSync, rmSync } = require('fs');
const { join } = require('path');

const testDbPath = join(__dirname, '../', 'prisma', 'test.db');
const testDbJournalPath = join(__dirname, '../', 'prisma', 'test.db-journal');
const prismaEnvPath = join(__dirname, '../', 'prisma', '.env');
const tempPrismaEnvPath = join(__dirname, '../', 'prisma', 'temp.env');
const migrationsFolder = join(__dirname, '../', 'prisma', 'migrations');
const tempMigrationsFolder = join(__dirname, '../', 'prisma', 'temp-migrations');

// delete test relevant files
if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
}
if (existsSync(testDbJournalPath)) {
    unlinkSync(testDbJournalPath);
}
if (existsSync(migrationsFolder)) {
    rmSync(migrationsFolder, { recursive: true, force: true });
}
if (existsSync(prismaEnvPath)) {
    unlinkSync(prismaEnvPath);
}

// restore original files
if (existsSync(tempPrismaEnvPath)) {
    renameSync(tempPrismaEnvPath, prismaEnvPath);
}
if (existsSync(tempMigrationsFolder)) {
    renameSync(tempMigrationsFolder, migrationsFolder);
}