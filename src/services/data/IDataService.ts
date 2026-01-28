import type { QueryOptions, InsertOptions, UpdateOptions, DeleteOptions } from '../types'

export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

export interface QueryArrayResult<T> {
  data: T[] | null
  error: Error | null
}

export interface IDataService {
  query<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryArrayResult<T>>

  queryOne<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  insert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: InsertOptions
  ): Promise<QueryResult<T> | QueryArrayResult<T>>

  update<T = any>(
    table: string,
    id: string,
    data: Partial<T>,
    options?: UpdateOptions
  ): Promise<QueryResult<T>>

  delete(
    table: string,
    id: string,
    options?: DeleteOptions
  ): Promise<{ error: Error | null }>

  subscribe(
    table: string,
    callback: (event: string, payload: any) => void
  ): () => void

  getSupabaseClient(): any
}
