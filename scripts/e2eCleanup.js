const { unlinkSync, existsSync } = require('fs');
const { join } = require('path');

const testDbPath = join(__dirname, '../', 'prisma', 'test.db');
const testDbJournalPath = join(__dirname, '../', 'prisma', 'test.db-journal');

if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
}
if (existsSync(testDbJournalPath)) {
    unlinkSync(testDbJournalPath);
}