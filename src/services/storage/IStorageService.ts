export interface UploadResult {
  path: string
  error: Error | null
}

export interface IStorageService {
  upload(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<UploadResult>

  download(bucket: string, path: string): Promise<Blob | null>

  delete(bucket: string, path: string): Promise<{ error: Error | null }>

  getPublicUrl(bucket: string, path: string): string

  list(bucket: string, path?: string): Promise<{ data: any[] | null; error: Error | null }>
}
