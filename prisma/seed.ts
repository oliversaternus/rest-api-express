import { PrismaClient, Prisma } from '@prisma/client'
import * as hashJS from "hash.js";

const prisma = new PrismaClient()

const userData: Prisma.UserCreateInput[] = [
  {
    name: 'Alice',
    email: 'alice@prisma.io',
    password: hashJS.sha256().update('123456').digest("hex"),
    role: 'admin'
  },
  {
    name: 'Nilu',
    email: 'nilu@prisma.io',
    password: hashJS.sha256().update('123456').digest("hex"),
    role: 'user'
  },
  {
    name: 'Mahmoud',
    email: 'mahmoud@prisma.io',
    password: hashJS.sha256().update('123456').digest("hex"),
    role: 'user'
  },
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
