<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/configStore'
import { useUIStore } from '../stores/uiStore'
import { filterService, DEFAULT_PRESETS } from '../services/filterService'

const configStore = useConfigStore()
const uiStore = useUIStore()

const emit = defineEmits<{
  close: []
}>()

// Tabs
const activeTab = ref<'connection' | 'filters' | 'general'>('connection')

// Connection form
const obsForm = ref({
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  bucket: ''
})

const testingConnection = ref(false)
const connectionTestResult = ref<'success' | 'error' | null>(null)

// Filter patterns
const newPattern = ref('')
const selectedPreset = ref('')

// Load current config
onMounted(() => {
  if (configStore.config.obs) {
    obsForm.value = { ...configStore.config.obs }
  }
})

// Connection methods
async function testConnection() {
  if (!obsForm.value.accessKeyId || !obsForm.value.secretAccessKey || 
      !obsForm.value.endpoint || !obsForm.value.bucket) {
    return
  }

  testingConnection.value = true
  connectionTestResult.value = null

  // Temporarily save and try to connect
  await configStore.saveOBSConfig(obsForm.value)
  const success = await configStore.connect()
  
  connectionTestResult.value = success ? 'success' : 'error'
  testingConnection.value = false
}

async function saveConnection() {
  await configStore.saveOBSConfig(obsForm.value)
  await configStore.connect()
  uiStore.notify({
    type: 'success',
    title: 'Configuración guardada'
  })
}

// Filter methods
function addPattern() {
  if (newPattern.value && filterService.isValidPattern(newPattern.value)) {
    const patterns = [...configStore.config.excludePatterns, newPattern.value]
    configStore.saveExcludePatterns(patterns)
    filterService.setPatterns(patterns)
    newPattern.value = ''
  }
}

function removePattern(index: number) {
  const patterns = [...configStore.config.excludePatterns]
  patterns.splice(index, 1)
  configStore.saveExcludePatterns(patterns)
  filterService.setPatterns(patterns)
}

function applyPreset() {
  if (selectedPreset.value) {
    filterService.applyPreset(selectedPreset.value)
    configStore.saveExcludePatterns(filterService.getPatterns())
  }
}

// General methods
function toggleWatch() {
  const enabled = !configStore.config.watchEnabled
  configStore.saveWatchEnabled(enabled)
  
  if (enabled && configStore.config.localPath) {
    window.electronAPI.startWatch(
      configStore.config.localPath, 
      configStore.config.excludePatterns
    )
  } else {
    window.electronAPI.stopWatch()
  }
}

async function selectLocalPath() {
  const path = await window.electronAPI.selectFolder()
  if (path) {
    await configStore.saveLocalPath(path)
  }
}
</script>

<template>
  <div class="settings-overlay" @click.self="emit('close')">
    <div class="settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Configuración</h2>
        <button @click="emit('close')" class="close-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="tabs">
        <button 
          @click="activeTab = 'connection'"
          :class="['tab', { active: activeTab === 'connection' }]"
        >
          Conexión OBS
        </button>
        <button 
          @click="activeTab = 'filters'"
          :class="['tab', { active: activeTab === 'filters' }]"
        >
          Filtros
        </button>
        <button 
          @click="activeTab = 'general'"
          :class="['tab', { active: activeTab === 'general' }]"
        >
          General
        </button>
      </div>
      
      <!-- Content -->
      <div class="modal-content">
        <!-- Connection Tab -->
        <div v-if="activeTab === 'connection'" class="tab-content">
          <div class="form-group">
            <label class="form-label">Access Key ID</label>
            <input 
              v-model="obsForm.accessKeyId" 
              type="text" 
              class="input"
              placeholder="Ingresa tu Access Key ID"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Secret Access Key</label>
            <input 
              v-model="obsForm.secretAccessKey" 
              type="password" 
              class="input"
              placeholder="Ingresa tu Secret Access Key"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Endpoint</label>
            <input 
              v-model="obsForm.endpoint" 
              type="text" 
              class="input"
              placeholder="https://obs.region.myhuaweicloud.com"
            />
            <p class="form-hint">Ejemplo: https://obs.la-south-2.myhuaweicloud.com</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">Bucket</label>
            <input 
              v-model="obsForm.bucket" 
              type="text" 
              class="input"
              placeholder="nombre-del-bucket"
            />
          </div>
          
          <!-- Test connection result -->
          <div v-if="connectionTestResult" :class="['test-result', connectionTestResult]">
            <span v-if="connectionTestResult === 'success'">✓ Conexión exitosa</span>
            <span v-else>✕ Error de conexión: {{ configStore.connectionError }}</span>
          </div>
          
          <div class="form-actions">
            <button 
              @click="testConnection" 
              :disabled="testingConnection"
              class="btn btn-secondary"
            >
              {{ testingConnection ? 'Probando...' : 'Probar conexión' }}
            </button>
            <button @click="saveConnection" class="btn btn-primary">
              Guardar
            </button>
          </div>
        </div>
        
        <!-- Filters Tab -->
        <div v-if="activeTab === 'filters'" class="tab-content">
          <div class="form-group">
            <label class="form-label">Presets</label>
            <div class="flex gap-2">
              <select v-model="selectedPreset" class="input flex-1">
                <option value="">Selecciona un preset...</option>
                <option v-for="preset in DEFAULT_PRESETS" :key="preset.id" :value="preset.id">
                  {{ preset.name }}
                </option>
              </select>
              <button @click="applyPreset" :disabled="!selectedPreset" class="btn btn-secondary">
                Aplicar
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Añadir patrón</label>
            <div class="flex gap-2">
              <input 
                v-model="newPattern" 
                @keyup.enter="addPattern"
                type="text" 
                class="input flex-1"
                placeholder="*.tmp, node_modules/**, etc."
              />
              <button @click="addPattern" class="btn btn-primary">
                Añadir
              </button>
            </div>
            <p class="form-hint">Usa patrones glob (*, **, ?)</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">Patrones actuales</label>
            <div class="patterns-list">
              <div 
                v-for="(pattern, index) in configStore.config.excludePatterns" 
                :key="index"
                class="pattern-item"
              >
                <code class="pattern-text">{{ pattern }}</code>
                <button @click="removePattern(index)" class="pattern-remove">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p v-if="configStore.config.excludePatterns.length === 0" class="text-gray-500 text-sm">
                No hay patrones configurados
              </p>
            </div>
          </div>
        </div>
        
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="tab-content">
          <div class="form-group">
            <label class="form-label">Carpeta local predeterminada</label>
            <div class="flex gap-2">
              <input 
                :value="configStore.config.localPath" 
                type="text" 
                class="input flex-1"
                readonly
                placeholder="Selecciona una carpeta..."
              />
              <button @click="selectLocalPath" class="btn btn-secondary">
                Examinar
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Prefijo remoto predeterminado</label>
            <input 
              :value="configStore.config.remotePath"
              @change="configStore.saveRemotePath(($event.target as HTMLInputElement).value)"
              type="text" 
              class="input"
              placeholder="carpeta/subcarpeta/"
            />
          </div>
          
          <div class="form-group">
            <div class="flex items-center justify-between">
              <div>
                <label class="form-label mb-0">Sincronización automática (Watch)</label>
                <p class="form-hint">Detectar cambios en la carpeta local automáticamente</p>
              </div>
              <button 
                @click="toggleWatch"
                :class="['toggle', { active: configStore.config.watchEnabled }]"
              >
                <span class="toggle-switch"></span>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tema</label>
            <div class="theme-options">
              <button 
                @click="configStore.saveTheme('light')"
                :class="['theme-btn', { active: configStore.config.theme === 'light' }]"
              >
                ☀️ Claro
              </button>
              <button 
                @click="configStore.saveTheme('dark')"
                :class="['theme-btn', { active: configStore.config.theme === 'dark' }]"
              >
                🌙 Oscuro
              </button>
              <button 
                @click="configStore.saveTheme('system')"
                :class="['theme-btn', { active: configStore.config.theme === 'system' }]"
              >
                💻 Sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.settings-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-800 dark:text-white;
}

.close-btn {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700;
}

.tabs {
  @apply flex border-b border-gray-200 dark:border-gray-700;
}

.tab {
  @apply px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply border-b-2 border-transparent -mb-px;
}

.tab.active {
  @apply text-primary-600 dark:text-primary-400 border-primary-500;
}

.modal-content {
  @apply p-4 overflow-y-auto max-h-[60vh];
}

.tab-content {
  @apply space-y-4;
}

.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-200;
}

.form-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.form-actions {
  @apply flex gap-2 justify-end pt-4;
}

.test-result {
  @apply p-2 rounded text-sm;
}

.test-result.success {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.test-result.error {
  @apply bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400;
}

.patterns-list {
  @apply space-y-2 max-h-40 overflow-y-auto;
}

.pattern-item {
  @apply flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded;
}

.pattern-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.pattern-remove {
  @apply p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600;
}

.toggle {
  @apply relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors;
}

.toggle.active {
  @apply bg-primary-500;
}

.toggle-switch {
  @apply absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform;
}

.toggle.active .toggle-switch {
  @apply translate-x-6;
}

.theme-options {
  @apply flex gap-2;
}

.theme-btn {
  @apply flex-1 py-2 px-3 text-sm rounded border border-gray-300 dark:border-gray-600;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.theme-btn.active {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300;
}
</style>
