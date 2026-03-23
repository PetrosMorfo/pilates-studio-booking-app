import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    await sendWelcomeEmail({ name, email })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/welcome]', error)
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}