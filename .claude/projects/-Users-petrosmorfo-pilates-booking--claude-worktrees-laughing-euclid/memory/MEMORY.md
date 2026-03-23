# Pilates Booking App — Memory

## Project overview
Next.js 16 + Prisma + Supabase app for a pilates studio.
Two roles: CLIENT and ADMIN (INSTRUCTOR role was removed).
Main worktree: /Users/petrosmorfo/pilates-booking
Active worktree: /Users/petrosmorfo/pilates-booking/.claude/worktrees/laughing-euclid

## Tech stack
- Next.js 16 App Router, React 19, TypeScript 5
- Tailwind CSS 4 + custom CSS variables (Evergreen Dreams palette)
- Prisma 7 with PostgreSQL (via @prisma/adapter-pg)
- Supabase Auth (cookie + Bearer token hybrid)
- Resend for emails (optional, gracefully skipped if key absent)

## Key files
- `src/lib/actions.ts` — all server actions (bookClass, cancelBooking, leaveWaitlist, toggleCheckIn, grantCredits, createClass, deleteClass)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/context/AuthContext.tsx` — client-side auth state, role: 'CLIENT' | 'ADMIN'
- `src/proxy.ts` — Next.js middleware for Supabase session refresh
- `src/app/api/me/route.ts` — auth endpoint, auto-creates user profile on first login
- `prisma/schema.prisma` — models: User, PilatesClass, Booking, Waitlist, CreditTransaction

## Architecture decisions made
- INSTRUCTOR role removed; check-in moved to /admin/attendance
- Waitlist promotion wrapped in Prisma interactive transaction (atomic)
- bookClass capacity check inside transaction (reduces race window)
- toggleCheckIn, createClass, deleteClass all require ADMIN role
- alert()/confirm() replaced with inline error/confirmation state in all components
- Class duration is now a selectable field (45/60/75/90 min), no longer hardcoded 60min
- Deleted: /api/classes/route.ts (duplicate of /api/me), Auth.tsx, ClassCard.tsx (old prototypes)

## Patterns
- Supabase auth helpers: always createServerClient in server components/actions
- `getAuthUserId()` for lightweight auth, `getAuthUser()` when role check is needed
- Inline error pattern: `const [error, setError] = useState<string | null>(null)`
- Two-step confirm pattern in CancelButton and DeleteClassButton (confirming state)
