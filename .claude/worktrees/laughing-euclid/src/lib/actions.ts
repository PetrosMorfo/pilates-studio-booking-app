'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { id: user.id } })
}

export async function bookClass(classId: string) {
  try {
    const userId = await getAuthUserId()
    if (!userId) throw new Error('You must be signed in to book a class.')

    const userExists = await prisma.user.findUnique({ where: { id: userId } })
    if (!userExists) throw new Error('User profile not found. Please sign out and sign back in.')

    const existingBooking = await prisma.booking.findUnique({
      where: { userId_pilatesClassId: { userId, pilatesClassId: classId } }
    })
    if (existingBooking) throw new Error("You've already booked this class.")

    const existingWaitlist = await prisma.waitlist.findUnique({
      where: { userId_pilatesClassId: { userId, pilatesClassId: classId } }
    })
    if (existingWaitlist) throw new Error("You're already on the waitlist for this class.")

    // Capacity check and booking creation are inside a transaction to reduce
    // the window for double-booking when multiple users book simultaneously.
    const result = await prisma.$transaction(async (tx) => {
      const pilatesClass = await tx.pilatesClass.findUnique({
        where: { id: classId },
        include: { bookings: true, waitlist: true }
      })
      if (!pilatesClass) throw new Error('Class not found.')

      const spotsLeft = pilatesClass.capacity - pilatesClass.bookings.length

      if (spotsLeft > 0) {
        await tx.booking.create({ data: { userId, pilatesClassId: classId } })
        return { waitlisted: false }
      } else {
        const nextPosition = pilatesClass.waitlist.length + 1
        await tx.waitlist.create({
          data: { userId, pilatesClassId: classId, position: nextPosition }
        })
        return { waitlisted: true, position: nextPosition }
      }
    })

    revalidatePath('/')
    revalidatePath('/my-bookings')
    return { success: true, ...result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const userId = await getAuthUserId()
    if (!userId) throw new Error('Unauthorized')

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId },
      include: { pilatesClass: true }
    })
    if (!booking) throw new Error('Booking not found.')

    const hoursUntilClass = (new Date(booking.pilatesClass.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntilClass < 24) {
      throw new Error('Cancellations are not allowed within 24 hours of class start.')
    }

    // Delete the booking and promote the next waitlisted person atomically.
    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({ where: { id: bookingId, userId } })

      const nextOnWaitlist = await tx.waitlist.findFirst({
        where: { pilatesClassId: booking.pilatesClassId },
        orderBy: { position: 'asc' }
      })

      if (nextOnWaitlist) {
        await tx.booking.create({
          data: { userId: nextOnWaitlist.userId, pilatesClassId: nextOnWaitlist.pilatesClassId }
        })
        await tx.waitlist.delete({ where: { id: nextOnWaitlist.id } })
        await tx.waitlist.updateMany({
          where: { pilatesClassId: booking.pilatesClassId, position: { gt: nextOnWaitlist.position } },
          data: { position: { decrement: 1 } }
        })
      }
    })

    revalidatePath('/')
    revalidatePath('/my-bookings')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' }
  }
}

export async function leaveWaitlist(waitlistId: string) {
  try {
    const userId = await getAuthUserId()
    if (!userId) throw new Error('Unauthorized')

    const entry = await prisma.waitlist.findUnique({ where: { id: waitlistId, userId } })
    if (!entry) throw new Error('Waitlist entry not found.')

    await prisma.waitlist.delete({ where: { id: waitlistId } })
    await prisma.waitlist.updateMany({
      where: { pilatesClassId: entry.pilatesClassId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } }
    })

    revalidatePath('/')
    revalidatePath('/my-bookings')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to leave waitlist' }
  }
}

export async function toggleCheckIn(bookingId: string, currentStatus: boolean) {
  try {
    const admin = await getAuthUser()
    if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized')

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    })
    if (!booking) throw new Error('Booking not found')

    const newStatus = !currentStatus

    if (newStatus === true) {
      // Checking IN — deduct 1 credit atomically
      if (booking.user.credits < 1) {
        throw new Error(`${booking.user.name || booking.user.email} has no credits remaining.`)
      }
      await prisma.$transaction([
        prisma.booking.update({ where: { id: bookingId }, data: { checkedIn: true } }),
        prisma.user.update({ where: { id: booking.userId }, data: { credits: { decrement: 1 } } }),
        prisma.creditTransaction.create({
          data: {
            userId: booking.userId,
            amount: -1,
            type: 'DEDUCTED',
            note: `Check-in for booking ${bookingId}`
          }
        })
      ])
    } else {
      // Unchecking — refund 1 credit
      await prisma.$transaction([
        prisma.booking.update({ where: { id: bookingId }, data: { checkedIn: false } }),
        prisma.user.update({ where: { id: booking.userId }, data: { credits: { increment: 1 } } }),
        prisma.creditTransaction.create({
          data: {
            userId: booking.userId,
            amount: 1,
            type: 'REFUNDED',
            note: `Check-in reversed for booking ${bookingId}`
          }
        })
      ])
    }

    revalidatePath('/admin/attendance')
    revalidatePath('/admin')
    revalidatePath('/admin/credits')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Check-in failed' }
  }
}

export async function grantCredits(targetUserId: string, amount: number, note?: string) {
  try {
    const admin = await getAuthUser()
    if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: { credits: { increment: amount } }
      }),
      prisma.creditTransaction.create({
        data: {
          userId: targetUserId,
          amount,
          type: 'MANUAL_GRANT',
          note: note || `Manual grant of ${amount} credit${amount !== 1 ? 's' : ''} by admin`
        }
      })
    ])

    revalidatePath('/admin/credits')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to grant credits' }
  }
}

export async function createClass(formData: {
  name: string
  instructor: string
  startTime: string
  durationMinutes: number
  capacity: number
  type: 'IN_PERSON' | 'ONLINE'
}) {
  try {
    const admin = await getAuthUser()
    if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized')

    const capacity = Number(formData.capacity)
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
      throw new Error('Capacity must be between 1 and 100.')
    }

    const durationMinutes = Number(formData.durationMinutes)
    if (![45, 60, 75, 90].includes(durationMinutes)) {
      throw new Error('Invalid duration.')
    }

    const start = new Date(formData.startTime)
    if (isNaN(start.getTime())) throw new Error('Invalid start time.')
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

    await prisma.pilatesClass.create({
      data: {
        name: formData.name.trim(),
        instructor: formData.instructor.trim(),
        startTime: start,
        endTime: end,
        capacity,
        type: formData.type,
      },
    })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create class' }
  }
}

export async function createManyClasses(classes: Array<{
  name: string
  instructor: string
  startTime: string
  durationMinutes: number
  capacity: number
  type: 'IN_PERSON' | 'ONLINE'
}>) {
  try {
    const admin = await getAuthUser()
    if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized')

    if (classes.length === 0) throw new Error('No classes to create.')
    if (classes.length > 200) throw new Error('Too many classes at once (max 200).')

    const data = classes.map((cls) => {
      const capacity = Number(cls.capacity)
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
        throw new Error('Capacity must be between 1 and 100.')
      }
      const durationMinutes = Number(cls.durationMinutes)
      if (![45, 60, 75, 90].includes(durationMinutes)) {
        throw new Error('Invalid duration.')
      }
      const start = new Date(cls.startTime)
      if (isNaN(start.getTime())) throw new Error('Invalid start time.')
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
      return {
        name: cls.name.trim(),
        instructor: cls.instructor.trim(),
        startTime: start,
        endTime: end,
        capacity,
        type: cls.type,
      }
    })

    await prisma.pilatesClass.createMany({ data })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, count: data.length }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create classes' }
  }
}

export async function deleteClass(classId: string) {
  try {
    const admin = await getAuthUser()
    if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.pilatesClass.delete({ where: { id: classId } })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete class' }
  }
}
