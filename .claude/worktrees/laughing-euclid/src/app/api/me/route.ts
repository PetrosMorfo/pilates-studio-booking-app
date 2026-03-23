import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let userEmail: string | null = null
    let userFullName: string | null = null

    // First try Bearer token (used right after login before cookie is set)
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      if (user) {
        userId = user.id
        userEmail = user.email ?? null
        userFullName = user.user_metadata?.full_name ?? null
      }
    }

    // Fall back to cookie-based session
    if (!userId) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email ?? null
        userFullName = user.user_metadata?.full_name ?? null
      }
    }

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, email: true }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: userEmail,
          name: userFullName,
          role: 'CLIENT',
        },
        select: { id: true, name: true, role: true, email: true }
      })
    }

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('[/api/me]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}