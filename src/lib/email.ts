const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Pilates Studio <onboarding@resend.dev>'

async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  console.log('[email] RESEND_API_KEY present:', !!RESEND_API_KEY)
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping email to', to)
    return
  }
  console.log('[email] Sending to:', to, 'subject:', subject)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('[email] Failed to send:', error)
  }
}

export async function sendWelcomeEmail({ name, email }: { name: string; email: string }) {
  await sendEmail({
    to: email,
    subject: 'Welcome to the studio!',
    text: `Hi ${name || 'there'},

Welcome! Your account has been created and you're ready to start booking classes.

Here's how it works:
- Browse available classes and hit "Book Now" to reserve your spot
- Credits are deducted when your instructor marks you as present
- You can cancel up to 24 hours before a class starts

See you on the mat!
The Studio Team`,
  })
}

export async function sendReminderEmail({
  name,
  email,
  className,
  startTime,
}: {
  name: string
  email: string
  className: string
  startTime: Date
}) {
  const dateStr = startTime.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  })
  const timeStr = startTime.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens'
  })

  await sendEmail({
    to: email,
    subject: `Reminder: ${className} tomorrow at ${timeStr}`,
    text: `Hi ${name || 'there'},

Just a reminder that you have a class tomorrow:

  ${className}
  ${dateStr} at ${timeStr}

If you need to cancel, you have until 24 hours before the class starts.

See you then!
The Studio Team`,
  })
}