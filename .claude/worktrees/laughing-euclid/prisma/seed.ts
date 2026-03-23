import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
const { Pool } = pkg

// 1. Setup the connection for the seed process
const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data to prevent primary key conflicts
  await prisma.booking.deleteMany()
  await prisma.pilatesClass.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create a Sample Instructor
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@pilates.com',
      name: 'Sarah Smith',
      role: 'INSTRUCTOR',
    },
  })

  // 3. Create upcoming classes
  await prisma.pilatesClass.createMany({
    data: [
      {
        name: 'Morning Reformer',
        instructor: 'Sarah Smith',
        startTime: new Date('2026-02-12T08:00:00Z'), // Tomorrow!
        endTime: new Date('2026-02-12T09:00:00Z'),
        capacity: 8,
      },
      {
        name: 'Mat Foundations',
        instructor: 'Sarah Smith',
        startTime: new Date('2026-02-13T10:30:00Z'), // Friday!
        endTime: new Date('2026-02-13T11:30:00Z'),
        capacity: 12,
      }
    ],
  })

  console.log('✅ Seeding complete! Sarah Smith is ready for class.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end() // Close the pool so the script can exit
  })