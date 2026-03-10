import { contextBridge, ipcRenderer } from 'electron'
import type { FileInfo, WatchEvent } from '../../electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  readDirectory: (path: string): Promise<FileInfo[]> => 
    ipcRenderer.invoke('fs:readDirectory', path),
  
  getFileStats: (path: string): Promise<FileInfo> => 
    ipcRenderer.invoke('fs:getFileStats', path),
  
  readFileAsBuffer: (path: string): Promise<ArrayBuffer> => 
    ipcRenderer.invoke('fs:readFileAsBuffer', path),
  
  writeFile: (path: string, data: ArrayBuffer): Promise<void> => 
    ipcRenderer.invoke('fs:writeFile', path, data),
  
  deleteFile: (path: string): Promise<void> => 
    ipcRenderer.invoke('fs:deleteFile', path),
  
  deleteFolder: (path: string): Promise<void> => 
    ipcRenderer.invoke('fs:deleteFolder', path),
  
  createFolder: (path: string): Promise<void> => 
    ipcRenderer.invoke('fs:createFolder', path),
  
  exists: (path: string): Promise<boolean> => 
    ipcRenderer.invoke('fs:exists', path),
  
  getHomePath: (): Promise<string> => 
    ipcRenderer.invoke('fs:getHomePath'),

  // Dialog operations
  selectFolder: (): Promise<string | null> => 
    ipcRenderer.invoke('dialog:selectFolder'),
  
  selectFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> => 
    ipcRenderer.invoke('dialog:selectFile', filters),

  // Watch operations
  startWatch: (path: string, patterns: string[]): Promise<void> => 
    ipcRenderer.invoke('watch:start', path, patterns),
  
  stopWatch: (): Promise<void> => 
    ipcRenderer.invoke('watch:stop'),
  
  onWatchEvent: (callback: (event: WatchEvent) => void): void => {
    ipcRenderer.on('watch:event', (_, event) => callback(event))
  },

  // Config operations
  getConfig: <T>(key: string): Promise<T | undefined> => 
    ipcRenderer.invoke('config:get', key),
  
  setConfig: <T>(key: string, value: T): Promise<void> => 
    ipcRenderer.invoke('config:set', key, value),
  
  deleteConfig: (key: string): Promise<void> => 
    ipcRenderer.invoke('config:delete', key),

  // OBS operations
  obsInitialize: (config: { accessKeyId: string; secretAccessKey: string; endpoint: string; bucket: string }): Promise<boolean> =>
    ipcRenderer.invoke('obs:initialize', config),
  
  obsTestConnection: (): Promise<boolean> =>
    ipcRenderer.invoke('obs:testConnection'),
  
  obsIsInitialized: (): Promise<boolean> =>
    ipcRenderer.invoke('obs:isInitialized'),
  
  obsListObjects: (prefix: string): Promise<unknown[]> =>
    ipcRenderer.invoke('obs:listObjects', prefix),
  
  obsUploadObject: (key: string, data: ArrayBuffer): Promise<boolean> =>
    ipcRenderer.invoke('obs:uploadObject', key, data),
  
  obsDownloadObject: (key: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('obs:downloadObject', key),
  
  obsDeleteObject: (key: string): Promise<boolean> =>
    ipcRenderer.invoke('obs:deleteObject', key),
  
  obsDeleteObjects: (keys: string[]): Promise<boolean> =>
    ipcRenderer.invoke('obs:deleteObjects', keys),
  
  obsCreateFolder: (prefix: string): Promise<boolean> =>
    ipcRenderer.invoke('obs:createFolder', prefix),
  
  obsGetObjectMetadata: (key: string): Promise<{ size: number; lastModified: string; etag: string } | null> =>
    ipcRenderer.invoke('obs:getObjectMetadata', key),

  // App operations
  getAppVersion: (): Promise<string> => 
    ipcRenderer.invoke('app:getVersion'),
  
  openExternal: (url: string): Promise<void> => 
    ipcRenderer.invoke('app:openExternal', url),

  // Window controls
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close')
})
