import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReminderEmail } from '@/lib/email'

// Vercel cron calls this every hour
// We look for classes starting in 23–25 hours from now
export async function GET(request: NextRequest) {
  // Protect the route — Vercel signs cron requests with this header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const classes = await prisma.pilatesClass.findMany({
    where: {
      startTime: {
        gte: windowStart,
        lte: windowEnd,
      }
    },
    include: {
      bookings: {
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  })

  let sent = 0

  for (const cls of classes) {
    for (const booking of cls.bookings) {
      await sendReminderEmail({
        name: booking.user.name ?? '',
        email: booking.user.email,
        className: cls.name,
        startTime: cls.startTime,
      })
      sent++
    }
  }

  console.log(`[cron/reminders] Sent ${sent} reminder(s) for ${classes.length} class(es)`)
  return NextResponse.json({ success: true, sent, classes: classes.length })
}