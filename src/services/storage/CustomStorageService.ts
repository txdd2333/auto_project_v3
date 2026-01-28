import type { IStorageService, UploadResult } from './IStorageService'

export class CustomStorageService implements IStorageService {
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
        'Authorization': `Bearer ${session.access_token}`,
      }
    } catch (error) {
      throw new Error('Invalid session')
    }
  }

  async upload(bucket: string, path: string, file: File | Blob): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('path', path)

      const response = await fetch(`${this.apiUrl}/api/storage/upload`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          path: '',
          error: new Error(result.message || 'Upload failed'),
        }
      }

      return {
        path: result.path,
        error: null,
      }
    } catch (error) {
      return {
        path: '',
        error: error instanceof Error ? error : new Error('Network error'),
      }
    }
  }

  async download(bucket: string, path: string): Promise<Blob | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/storage/download?bucket=${bucket}&path=${encodeURIComponent(path)}`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.blob()
    } catch (error) {
      console.error('Download error:', error)
      return null
    }
  }

  async delete(bucket: string, path: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/storage/delete?bucket=${bucket}&path=${encodeURIComponent(path)}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      )

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

  getPublicUrl(bucket: string, path: string): string {
    return `${this.apiUrl}/api/storage/public/${bucket}/${path}`
  }

  async list(bucket: string, path?: string): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const queryPath = path ? `&path=${encodeURIComponent(path)}` : ''
      const response = await fetch(
        `${this.apiUrl}/api/storage/list?bucket=${bucket}${queryPath}`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || 'List failed'),
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
}
