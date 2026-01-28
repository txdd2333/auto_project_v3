import type { IAuthService } from './IAuthService'
import type { AuthResult, User, Session } from '../types'

export class CustomAuthService implements IAuthService {
  private apiUrl: string
  private session: Session | null = null
  private listeners: Set<(session: Session | null) => void> = new Set()

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    this.loadSessionFromStorage()
  }

  private loadSessionFromStorage(): void {
    const sessionStr = localStorage.getItem('auth_session')
    if (sessionStr) {
      try {
        this.session = JSON.parse(sessionStr)
        if (this.session && this.session.expires_at) {
          const expiresAt = new Date(this.session.expires_at).getTime()
          if (expiresAt < Date.now()) {
            this.session = null
            localStorage.removeItem('auth_session')
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error)
        localStorage.removeItem('auth_session')
      }
    }
  }

  private saveSessionToStorage(session: Session | null): void {
    if (session) {
      localStorage.setItem('auth_session', JSON.stringify(session))
    } else {
      localStorage.removeItem('auth_session')
    }
    this.session = session
    this.notifyListeners(session)
  }

  private notifyListeners(session: Session | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(session)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: new Error(data.message || 'Login failed'),
        }
      }

      const session: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user,
      }

      this.saveSessionToStorage(session)

      return {
        user: data.user,
        session,
        error: null,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: new Error(data.message || 'Registration failed'),
        }
      }

      const session: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user,
      }

      this.saveSessionToStorage(session)

      return {
        user: data.user,
        session,
        error: null,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async signOut(): Promise<void> {
    this.saveSessionToStorage(null)
  }

  async getSession(): Promise<Session | null> {
    if (!this.session) {
      return null
    }

    if (this.session.expires_at) {
      const expiresAt = new Date(this.session.expires_at).getTime()
      if (expiresAt < Date.now()) {
        this.saveSessionToStorage(null)
        return null
      }
    }

    return this.session
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession()
    return session?.user || null
  }

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback)

    setTimeout(() => {
      callback(this.session)
    }, 0)

    return () => {
      this.listeners.delete(callback)
    }
  }
}
