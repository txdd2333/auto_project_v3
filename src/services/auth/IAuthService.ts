import type { User, Session, AuthResult, Unsubscribe } from '../types'

export interface IAuthService {
  signIn(email: string, password: string): Promise<AuthResult>

  signUp(email: string, password: string): Promise<AuthResult>

  signOut(): Promise<void>

  getSession(): Promise<Session | null>

  getCurrentUser(): Promise<User | null>

  onAuthStateChange(callback: (session: Session | null) => void): Unsubscribe
}
