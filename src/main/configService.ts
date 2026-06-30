import Store from 'electron-store'
import type { IpcMainInvokeEvent } from 'electron'

interface OBSConfig {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  bucket: string
}

interface AppConfig {
  obs?: OBSConfig
  localPath?: string
  remotePath?: string
  excludePatterns?: string[]
  watchEnabled?: boolean
  theme?: 'light' | 'dark' | 'system'
}

const store = new Store<AppConfig>({
  name: 'sync-obs-config',
  encryptionKey: 'sync-obs-clubf5-secure-key',
  defaults: {
    excludePatterns: [
      '*.tmp',
      '*.log',
      '*.bak',
      'node_modules/**',
      '.git/**',
      'Thumbs.db',
      '.DS_Store'
    ],
    watchEnabled: false,
    theme: 'system'
  }
})

function getConfig<T>(_event: IpcMainInvokeEvent, key: string): T | undefined {
  return store.get(key) as T | undefined
}

function setConfig<T>(_event: IpcMainInvokeEvent, key: string, value: T): void {
  store.set(key, value)
}

function deleteConfig(_event: IpcMainInvokeEvent, key: string): void {
  store.delete(key as keyof AppConfig)
}

function getAllConfig(): AppConfig {
  return store.store
}

export const configHandlers = {
  'config:get': getConfig,
  'config:set': setConfig,
  'config:delete': deleteConfig,
  'config:getAll': getAllConfig
}
