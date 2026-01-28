import type { IAuthService } from './auth/IAuthService'
import type { IDataService } from './data/IDataService'
import type { IStorageService } from './storage/IStorageService'
import { SupabaseAuthService } from './auth/SupabaseAuthService'
import { SupabaseDataService } from './data/SupabaseDataService'
import { SupabaseStorageService } from './storage/SupabaseStorageService'
import { CustomAuthService } from './auth/CustomAuthService'
import { CustomDataService } from './data/CustomDataService'
import { CustomStorageService } from './storage/CustomStorageService'

type ServiceProvider = 'supabase' | 'custom'

class ServiceFactory {
  private static authServiceInstance: IAuthService | null = null
  private static dataServiceInstance: IDataService | null = null
  private static storageServiceInstance: IStorageService | null = null

  private static getProvider(): ServiceProvider {
    return (import.meta.env.VITE_SERVICE_PROVIDER as ServiceProvider) || 'supabase'
  }

  static getAuthService(): IAuthService {
    if (!this.authServiceInstance) {
      const provider = this.getProvider()

      switch (provider) {
        case 'supabase':
          this.authServiceInstance = new SupabaseAuthService()
          break
        case 'custom':
          this.authServiceInstance = new CustomAuthService()
          break
        default:
          throw new Error(`Unknown service provider: ${provider}`)
      }
    }

    return this.authServiceInstance
  }

  static getDataService(): IDataService {
    if (!this.dataServiceInstance) {
      const provider = this.getProvider()

      switch (provider) {
        case 'supabase':
          this.dataServiceInstance = new SupabaseDataService()
          break
        case 'custom':
          this.dataServiceInstance = new CustomDataService()
          break
        default:
          throw new Error(`Unknown service provider: ${provider}`)
      }
    }

    return this.dataServiceInstance
  }

  static getStorageService(): IStorageService {
    if (!this.storageServiceInstance) {
      const provider = this.getProvider()

      switch (provider) {
        case 'supabase':
          this.storageServiceInstance = new SupabaseStorageService()
          break
        case 'custom':
          this.storageServiceInstance = new CustomStorageService()
          break
        default:
          throw new Error(`Unknown service provider: ${provider}`)
      }
    }

    return this.storageServiceInstance
  }

  static reset(): void {
    this.authServiceInstance = null
    this.dataServiceInstance = null
    this.storageServiceInstance = null
  }
}

export default ServiceFactory
