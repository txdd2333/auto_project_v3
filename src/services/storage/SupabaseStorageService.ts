import { supabase } from '../../lib/supabase'
import type { IStorageService, UploadResult } from './IStorageService'

export class SupabaseStorageService implements IStorageService {
  async upload(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<UploadResult> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
      })

    return {
      path: data?.path || '',
      error: error as Error | null,
    }
  }

  async download(bucket: string, path: string): Promise<Blob | null> {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error || !data) {
      return null
    }

    return data
  }

  async delete(bucket: string, path: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage.from(bucket).remove([path])

    return { error: error as Error | null }
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async list(
    bucket: string,
    path?: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    const { data, error } = await supabase.storage.from(bucket).list(path)

    return {
      data: data || null,
      error: error as Error | null,
    }
  }
}
