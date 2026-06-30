import type { IpcMainInvokeEvent } from 'electron'
import { BrowserWindow } from 'electron'
import * as chokidar from 'chokidar'
import { minimatch } from 'minimatch'

let watcher: chokidar.FSWatcher | null = null
let excludePatterns: string[] = []

function sendWatchEvent(type: string, filePath: string) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((win: BrowserWindow) => {
    win.webContents.send('watch:event', { type, path: filePath })
  })
}

function shouldExclude(filePath: string): boolean {
  return excludePatterns.some(pattern => minimatch(filePath, pattern, { dot: true }))
}

async function startWatch(_event: IpcMainInvokeEvent, watchPath: string, patterns: string[] = []): Promise<void> {
  // Stop existing watcher
  if (watcher) {
    await watcher.close()
  }

  excludePatterns = patterns

  watcher = chokidar.watch(watchPath, {
    ignored: (path) => shouldExclude(path),
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  })

  watcher
    .on('add', (path) => sendWatchEvent('add', path))
    .on('change', (path) => sendWatchEvent('change', path))
    .on('unlink', (path) => sendWatchEvent('unlink', path))
    .on('addDir', (path) => sendWatchEvent('addDir', path))
    .on('unlinkDir', (path) => sendWatchEvent('unlinkDir', path))
    .on('error', (error) => console.error('Watch error:', error))
}

async function stopWatch(): Promise<void> {
  if (watcher) {
    await watcher.close()
    watcher = null
  }
}

export const watchHandlers = {
  'watch:start': startWatch,
  'watch:stop': stopWatch
}
