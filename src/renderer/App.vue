<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useConfigStore } from './stores/configStore'
import { useUIStore } from './stores/uiStore'
import { obsService, type OBSObject } from './services/obsService'
import { filterService } from './services/filterService'
import { transferService } from './services/transferService'
import type { FileInfo } from '../../electron'

// Components
import TitleBar from './components/TitleBar.vue'
import Toolbar from './components/Toolbar.vue'
import FilePanel from './components/FilePanel.vue'
import StatusBar from './components/StatusBar.vue'
import TransferQueue from './components/TransferQueue.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import SyncDialog from './components/SyncDialog.vue'
import NewFolderDialog from './components/NewFolderDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import Notifications from './components/Notifications.vue'

const configStore = useConfigStore()
const uiStore = useUIStore()

// Panel states
const localPath = ref('')
const remotePath = ref('')
const localItems = ref<(FileInfo & { type: 'local' })[]>([])
const remoteItems = ref<(OBSObject & { type: 'remote'; path: string })[]>([])
const localLoading = ref(false)
const remoteLoading = ref(false)

// Dialog states
const showSettings = computed(() => uiStore.activeModal === 'settings')
const showSync = computed(() => uiStore.activeModal === 'sync')
const showNewFolder = ref(false)
const newFolderTarget = ref<'local' | 'obs'>('local')

const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  type: 'info' as 'info' | 'warning' | 'danger',
  onConfirm: () => {}
})

// Active panel (for knowing where operations should happen)
const activePanel = ref<'local' | 'obs'>('local')

// Initialize
onMounted(async () => {
  await configStore.loadConfig()
  
  // Set initial paths
  localPath.value = configStore.config.localPath || await window.electronAPI.getHomePath()
  remotePath.value = configStore.config.remotePath || ''
  
  // Load file lists
  await refreshLocal()
  if (configStore.isConnected) {
    await refreshRemote()
  }
  
  // Set up filter service
  filterService.setPatterns(configStore.config.excludePatterns)
  
  // Set up watch events
  window.electronAPI.onWatchEvent((event) => {
    console.log('Watch event:', event)
    // Refresh local panel on changes
    if (event.path.startsWith(localPath.value)) {
      refreshLocal()
    }
  })
  
  // Start watch if enabled
  if (configStore.config.watchEnabled && localPath.value) {
    window.electronAPI.startWatch(localPath.value, configStore.config.excludePatterns)
  }
})

// Watch for connection changes
watch(() => configStore.isConnected, async (connected) => {
  if (connected) {
    await refreshRemote()
  } else {
    remoteItems.value = []
  }
})

// Methods
async function refreshLocal() {
  if (!localPath.value) return
  
  localLoading.value = true
  try {
    const items = await window.electronAPI.readDirectory(localPath.value)
    const filtered = filterService.filterPaths(items)
    localItems.value = filtered.map(item => ({ ...item, type: 'local' as const }))
  } catch (error) {
    uiStore.notify({
      type: 'error',
      title: 'Error al leer carpeta local',
      message: (error as Error).message
    })
  } finally {
    localLoading.value = false
  }
}

async function refreshRemote() {
  if (!configStore.isConnected) return
  
  remoteLoading.value = true
  try {
    const items = await obsService.listObjects(remotePath.value)
    const filtered = filterService.filterPaths(items)
    remoteItems.value = filtered.map(item => ({ 
      ...item, 
      type: 'remote' as const,
      path: item.key
    }))
  } catch (error) {
    uiStore.notify({
      type: 'error',
      title: 'Error al leer OBS',
      message: (error as Error).message
    })
  } finally {
    remoteLoading.value = false
  }
}

async function navigateLocal(path: string) {
  localPath.value = path
  uiStore.clearLocalSelection()
  await refreshLocal()
}

async function navigateRemote(path: string) {
  remotePath.value = path
  uiStore.clearRemoteSelection()
  await refreshRemote()
}

function handleLocalPathChange(path: string) {
  navigateLocal(path)
}

function handleRemotePathChange(path: string) {
  navigateRemote(path)
}

function handleLocalSelect(item: FileInfo & { type: 'local' }, multi: boolean) {
  activePanel.value = 'local'
  uiStore.selectLocalItem(item.path, multi)
}

function handleRemoteSelect(item: OBSObject & { type: 'remote' }, multi: boolean) {
  activePanel.value = 'obs'
  uiStore.selectRemoteItem(item.key, multi)
}

function handleLocalOpen(item: FileInfo & { type: 'local' }) {
  if (item.isDirectory) {
    navigateLocal(item.path)
  }
  // For files, could open with system default app
}

function handleRemoteOpen(item: OBSObject & { type: 'remote' }) {
  if (item.isDirectory) {
    navigateRemote(item.key)
  }
}

// Toolbar actions
async function handleCopy() {
  const localSelected = uiStore.selectedLocalItems
  const remoteSelected = uiStore.selectedRemoteItems
  
  if (localSelected.length > 0) {
    // Copy local → OBS
    for (const localItemPath of localSelected) {
      const item = localItems.value.find(f => f.path === localItemPath)
      if (item && !item.isDirectory) {
        const targetKey = remotePath.value + item.name
        transferService.queueUpload(item.path, targetKey, item.name, item.size)
      }
    }
    uiStore.notify({ type: 'info', title: `${localSelected.length} archivo(s) en cola de subida` })
  } else if (remoteSelected.length > 0) {
    // Copy OBS → local
    for (const remoteKey of remoteSelected) {
      const item = remoteItems.value.find(f => f.key === remoteKey)
      if (item && !item.isDirectory) {
        const targetPath = localPath.value + '\\' + item.name
        transferService.queueDownload(item.key, targetPath, item.name, item.size)
      }
    }
    uiStore.notify({ type: 'info', title: `${remoteSelected.length} archivo(s) en cola de descarga` })
  }
  
  uiStore.clearAllSelections()
}

async function handleMove() {
  // Move = Copy + Delete source
  // First copy, then delete after confirmation
  uiStore.notify({ type: 'warning', title: 'Mover no implementado aún', message: 'Usa Copiar + Eliminar' })
}

function handleDelete() {
  const localSelected = uiStore.selectedLocalItems
  const remoteSelected = uiStore.selectedRemoteItems
  const total = localSelected.length + remoteSelected.length
  
  if (total === 0) return
  
  confirmDialog.value = {
    show: true,
    title: 'Confirmar eliminación',
    message: `¿Eliminar ${total} elemento(s) seleccionados?`,
    type: 'danger',
    onConfirm: async () => {
      confirmDialog.value.show = false
      
      // Delete local files
      for (const path of localSelected) {
        try {
          const item = localItems.value.find(f => f.path === path)
          if (item?.isDirectory) {
            await window.electronAPI.deleteFolder(path)
          } else {
            await window.electronAPI.deleteFile(path)
          }
        } catch (error) {
          uiStore.notify({ type: 'error', title: 'Error', message: (error as Error).message })
        }
      }
      
      // Delete remote files
      for (const key of remoteSelected) {
        try {
          await obsService.deleteObject(key)
        } catch (error) {
          uiStore.notify({ type: 'error', title: 'Error', message: (error as Error).message })
        }
      }
      
      uiStore.clearAllSelections()
      uiStore.notify({ type: 'success', title: 'Elementos eliminados' })
      
      await refreshLocal()
      await refreshRemote()
    }
  }
}

function handleNewFolder() {
  // Determine which panel is active
  newFolderTarget.value = activePanel.value
  showNewFolder.value = true
}

async function createNewFolder(name: string) {
  showNewFolder.value = false
  
  try {
    if (newFolderTarget.value === 'local') {
      const folderPath = localPath.value + '\\' + name
      await window.electronAPI.createFolder(folderPath)
      await refreshLocal()
    } else {
      const folderKey = remotePath.value + name + '/'
      await obsService.createFolder(folderKey)
      await refreshRemote()
    }
    uiStore.notify({ type: 'success', title: 'Carpeta creada' })
  } catch (error) {
    uiStore.notify({ type: 'error', title: 'Error', message: (error as Error).message })
  }
}

function handleSync() {
  uiStore.openModal('sync')
}

function handleRefresh() {
  refreshLocal()
  refreshRemote()
}

function handleSyncComplete() {
  refreshLocal()
  refreshRemote()
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (uiStore.activeModal) return
  
  switch (e.key) {
    case 'F2':
      handleRefresh()
      break
    case 'F5':
      handleCopy()
      break
    case 'F6':
      handleMove()
      break
    case 'F7':
      handleNewFolder()
      break
    case 'Delete':
      handleDelete()
      break
  }
}

// Add keyboard listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app">
    <!-- Title Bar -->
    <TitleBar />
    
    <!-- Toolbar -->
    <Toolbar 
      @copy="handleCopy"
      @move="handleMove"
      @delete="handleDelete"
      @new-folder="handleNewFolder"
      @sync="handleSync"
      @refresh="handleRefresh"
    />
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Panels -->
      <div class="panels">
        <!-- Local Panel -->
        <FilePanel
          source="local"
          :current-path="localPath"
          :items="localItems"
          :loading="localLoading"
          @navigate="navigateLocal"
          @select="handleLocalSelect"
          @open="handleLocalOpen"
          @path-change="handleLocalPathChange"
        />
        
        <!-- Remote Panel -->
        <FilePanel
          source="obs"
          :current-path="remotePath"
          :items="remoteItems"
          :loading="remoteLoading"
          @navigate="navigateRemote"
          @select="handleRemoteSelect"
          @open="handleRemoteOpen"
          @path-change="handleRemotePathChange"
        />
      </div>
      
      <!-- Transfer Queue (side panel) -->
      <Transition name="slide">
        <div v-if="uiStore.isTransferPanelOpen" class="transfer-sidebar">
          <TransferQueue />
        </div>
      </Transition>
    </div>
    
    <!-- Status Bar -->
    <StatusBar />
    
    <!-- Dialogs -->
    <SettingsDialog 
      v-if="showSettings" 
      @close="uiStore.closeModal()" 
    />
    
    <SyncDialog 
      v-if="showSync" 
      @close="uiStore.closeModal()"
      @complete="handleSyncComplete"
    />
    
    <NewFolderDialog
      v-if="showNewFolder"
      @close="showNewFolder = false"
      @submit="createNewFolder"
    />
    
    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.show = false"
    />
    
    <!-- Notifications -->
    <Notifications />
  </div>
</template>

<style scoped>
.app {
  @apply flex flex-col h-screen overflow-hidden;
}

.main-content {
  @apply flex-1 flex overflow-hidden;
}

.panels {
  @apply flex-1 flex gap-2 p-2 overflow-hidden;
}

.panels > * {
  @apply flex-1;
}

.transfer-sidebar {
  @apply w-80 flex-shrink-0;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
