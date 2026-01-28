import type { IDataService, QueryResult, QueryArrayResult } from './IDataService'
import type { QueryOptions } from '../types'

export class CustomDataService implements IDataService {
  private apiUrl: string

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  }

  private getAuthHeaders(): Record<string, string> {
    const sessionStr = localStorage.getItem('auth_session')
    if (!sessionStr) {
      throw new Error('Not authenticated')
    }

    try {
      const session = JSON.parse(sessionStr)
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      }
    } catch (error) {
      throw new Error('Invalid session')
    }
  }

  private buildQueryString(options?: QueryOptions): string {
    if (!options) return ''

    const params = new URLSearchParams()

    if (options.select) {
      params.append('select', options.select)
    }

    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(`filter_${key}`, String(value))
      })
    }

    if (options.order) {
      const { column, ascending = true } = options.order
      params.append('order', `${column}:${ascending ? 'asc' : 'desc'}`)
    }

    if (options.limit) {
      params.append('limit', String(options.limit))
    }

    if (options.offset) {
      params.append('offset', String(options.offset))
    }

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }

  async query<T>(table: string, options?: QueryOptions): Promise<QueryArrayResult<T>> {
    try {
      const queryString = this.buildQueryString(options)
      const response = await fetch(`${this.apiUrl}/api/data/${table}${queryString}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || 'Query failed'),
        }
      }

      return {
        data: result.data,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async queryOne<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const queryString = this.buildQueryString({ ...options, limit: 1 })
      const response = await fetch(`${this.apiUrl}/api/data/${table}${queryString}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || 'Query failed'),
        }
      }

      return {
        data: result.data && result.data.length > 0 ? result.data[0] : null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T> | QueryArrayResult<T>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/data/${table}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || 'Insert failed'),
        }
      }

      if (Array.isArray(data)) {
        return {
          data: result.data,
          error: null,
        }
      } else {
        return {
          data: result.data && result.data.length > 0 ? result.data[0] : null,
          error: null,
        }
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<QueryResult<T>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/data/${table}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || 'Update failed'),
        }
      }

      return {
        data: result.data,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async delete(table: string, id: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/data/${table}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const result = await response.json()
        return {
          error: new Error(result.message || 'Delete failed'),
        }
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  subscribe(_table: string, _callback: (event: string, payload: any) => void): () => void {
    console.warn('Real-time subscription not implemented for custom service')
    return () => {}
  }

  getSupabaseClient() {
    throw new Error('Supabase client not available in custom service mode')
  }
}
