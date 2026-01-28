import { supabase } from '../../lib/supabase'
import type { IAuthService } from './IAuthService'
import type { User, Session, AuthResult, Unsubscribe } from '../types'

export class SupabaseAuthService implements IAuthService {
  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error }
    }

    return {
      user: data.user ? this.mapUser(data.user) : undefined,
      session: data.session ? this.mapSession(data.session) : undefined,
      error: null,
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { error }
    }

    return {
      user: data.user ? this.mapUser(data.user) : undefined,
      session: data.session ? this.mapSession(data.session) : undefined,
      error: null,
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession()
    return data.session ? this.mapSession(data.session) : null
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    return data.user ? this.mapUser(data.user) : null
  }

  onAuthStateChange(callback: (session: Session | null) => void): Unsubscribe {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        callback(session ? this.mapSession(session) : null)
      })()
    })

    return () => subscription.unsubscribe()
  }

  private mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
    }
  }

  private mapSession(session: any): Session {
    return {
      user: this.mapUser(session.user),
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    }
  }
}
