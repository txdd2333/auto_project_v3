export interface User {
  id: string
  email: string
  created_at?: string
}

export interface Session {
  user: User
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export interface AuthResult {
  user?: User
  session?: Session
  error?: Error | null
}

export type Unsubscribe = () => void

export interface QueryOptions {
  select?: string
  filter?: Record<string, any>
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

export interface InsertOptions {
  returning?: boolean
}

export interface UpdateOptions {
  returning?: boolean
}

export interface DeleteOptions {
  returning?: boolean
}
