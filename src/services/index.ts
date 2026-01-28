import ServiceFactory from './ServiceFactory'

export const authService = ServiceFactory.getAuthService()
export const dataService = ServiceFactory.getDataService()
export const storageService = ServiceFactory.getStorageService()

export { ServiceFactory }

export type { IAuthService } from './auth/IAuthService'
export type { IDataService } from './data/IDataService'
export type { IStorageService } from './storage/IStorageService'
export type { User, Session, AuthResult, QueryOptions } from './types'
