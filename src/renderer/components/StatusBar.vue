<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '../stores/configStore'
import { useUIStore } from '../stores/uiStore'

const configStore = useConfigStore()
const uiStore = useUIStore()

const isConnected = computed(() => configStore.isConnected)
const totalSelected = computed(() => uiStore.totalSelectedCount)
</script>

<template>
  <div class="status-bar">
    <!-- Connection status -->
    <div class="status-section">
      <span 
        :class="['status-indicator', { connected: isConnected }]"
      ></span>
      <span class="status-text">
        {{ isConnected ? 'Conectado a OBS' : 'Desconectado' }}
      </span>
    </div>
    
    <!-- Selection info -->
    <div class="status-section" v-if="totalSelected > 0">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="status-text">{{ totalSelected }} elemento(s) seleccionado(s)</span>
    </div>
    
    <!-- Spacer -->
    <div class="flex-1"></div>
    
    <!-- Watch status -->
    <div class="status-section" v-if="configStore.config.watchEnabled">
      <svg class="w-4 h-4 text-green-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span class="status-text">Watch activo</span>
    </div>
    
    <!-- Theme toggle -->
    <button 
      @click="configStore.saveTheme(configStore.effectiveTheme === 'dark' ? 'light' : 'dark')"
      class="theme-toggle"
      :title="configStore.effectiveTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    >
      <svg v-if="configStore.effectiveTheme === 'dark'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.status-bar {
  @apply flex items-center gap-4 px-3 py-1.5 text-xs;
  @apply bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

.status-section {
  @apply flex items-center gap-1.5;
}

.status-indicator {
  @apply w-2 h-2 rounded-full bg-gray-400;
}

.status-indicator.connected {
  @apply bg-green-500;
}

.status-text {
  @apply text-gray-600 dark:text-gray-400;
}

.theme-toggle {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors;
}
</style>
