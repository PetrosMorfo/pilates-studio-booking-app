'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Enriched user type that includes role + name from our Prisma database
export type AppUser = SupabaseUser & {
  role: 'CLIENT' | 'ADMIN'
  name: string | null
}

type AuthContextType = {
  user: AppUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<AppUser> {
  try {
    const res = await fetch('/api/me')
    if (res.ok) {
      const profile = await res.json()
      return { ...supabaseUser, role: profile.role, name: profile.name }
    }
  } catch {}
  // Fallback: treat as CLIENT if profile fetch fails
  return { ...supabaseUser, role: 'CLIENT', name: null }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user) {
        const appUser = await fetchUserProfile(session.user)
        setUser(appUser)
      }
      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const appUser = await fetchUserProfile(session.user)
        setUser(appUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
