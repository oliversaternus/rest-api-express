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

const filesData = [
    {
        name: 'Bananas',
        caption: '1 yellow bananas',
        description: 'first file',
        hash: '4e0254f0-676c-46c9-a73f-c0286704229c',
        size: 1000,
        ext: '.jpg',
        mime: 'image/jpeg'
    },
    {
        name: 'Bananas',
        caption: '2 bananas',
        description: 'second file',
        hash: '57f833ef-7bd1-45e2-960d-b2c5348b84b2',
        size: 1000,
        ext: '.jpg',
        mime: 'image/jpeg'
    },
    {
        name: 'Bananas',
        caption: '3 bananas',
        description: 'third file',
        hash: '9c044425-63a1-447d-b51a-43cbada4968b',
        size: 1000,
        ext: '.jpg',
        mime: 'image/jpeg'
    },
    {
        name: 'Bananas',
        caption: '4 fruits',
        description: 'fourth file',
        hash: '8e01b505-9158-47e6-91a8-d5ff0871dc63',
        size: 1000,
        ext: '.jpg',
        mime: 'image/jpeg'
    }
]

async function main() {
    console.log(`Start seeding ...`)
    for (const user of userData) {
        const createdUser = await prisma.user.create({
            data: user,
        })
        console.log(`Created user with id: ${createdUser.id}`)
    }
    for (const file of filesData) {
        const createdFile = await prisma.file.create({
            data: file,
        })
        console.log(`Created file with id: ${createdFile.id}`)
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
