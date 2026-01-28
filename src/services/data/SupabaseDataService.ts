import { supabase } from '../../lib/supabase'
import type { IDataService, QueryResult, QueryArrayResult } from './IDataService'
import type { QueryOptions, InsertOptions, UpdateOptions, DeleteOptions } from '../types'

export class SupabaseDataService implements IDataService {
  async query<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryArrayResult<T>> {
    let query = supabase.from(table as any).select(options?.select || '*')

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    return {
      data: data as T[] || null,
      error: error as Error | null,
    }
  }

  async queryOne<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    let query = supabase.from(table as any).select(options?.select || '*')

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query.maybeSingle()

    return {
      data: data as T || null,
      error: error as Error | null,
    }
  }

  async insert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: InsertOptions
  ): Promise<QueryResult<T> | QueryArrayResult<T>> {
    const query = supabase.from(table as any).insert(data as any)

    const result = options?.returning !== false
      ? await query.select()
      : await query

    if (Array.isArray(data)) {
      return {
        data: (result.data as any) || null,
        error: result.error as Error | null,
      }
    } else {
      return {
        data: ((result.data as any)?.[0]) || null,
        error: result.error as Error | null,
      }
    }
  }

  async update<T = any>(
    table: string,
    id: string,
    data: Partial<T>,
    options?: UpdateOptions
  ): Promise<QueryResult<T>> {
    const query = supabase.from(table as any).update(data as any).eq('id', id)

    const result = options?.returning !== false
      ? await query.select()
      : await query

    return {
      data: ((result.data as any)?.[0]) || null,
      error: result.error as Error | null,
    }
  }

  async delete(
    table: string,
    id: string,
    _options?: DeleteOptions
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from(table as any).delete().eq('id', id)

    return { error: error as Error | null }
  }

  subscribe(
    table: string,
    callback: (event: string, payload: any) => void
  ): () => void {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          callback(payload.eventType, payload)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  getSupabaseClient() {
    return supabase
  }
}
