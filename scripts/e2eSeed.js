const { PrismaClient, Prisma } = require('@prisma/client');
const hashJS = require("hash.js");

const prisma = new PrismaClient()

const userData = [
    {
        name: 'Administrstor',
        email: 'admin@test.com',
        password: hashJS.sha256().update('123456').digest("hex"),
        role: 'admin'
    },
    {
        name: 'User',
        email: 'user@test.com',
        password: hashJS.sha256().update('123456').digest("hex"),
        role: 'user'
    }
]

async function main() {
    console.log(`Start seeding ...`)
    for (const u of userData) {
        const user = await prisma.user.create({
            data: u,
        })
        console.log(`Created user with id: ${user.id}`)
    }
    console.log(`Seeding finished.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })