<script setup lang="ts">
import { transferService } from '../services/transferService'

const queue = transferService.getQueue()
const stats = transferService.getStats()

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return '⏳'
    case 'in-progress': return '🔄'
    case 'completed': return '✅'
    case 'failed': return '❌'
    case 'cancelled': return '🚫'
    default: return '❓'
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    case 'cancelled': return 'text-gray-500'
    default: return 'text-gray-700 dark:text-gray-300'
  }
}
</script>

<template>
  <div class="transfer-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">Cola de transferencias</h3>
      <div class="header-stats">
        <span v-if="stats.inProgress > 0" class="stat-badge in-progress">
          {{ stats.inProgress }} activos
        </span>
        <span v-if="stats.pending > 0" class="stat-badge pending">
          {{ stats.pending }} pendientes
        </span>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="panel-actions" v-if="queue.length > 0">
      <button @click="transferService.clearCompleted()" class="action-btn">
        Limpiar completados
      </button>
      <button @click="transferService.cancelAll()" class="action-btn danger">
        Cancelar todo
      </button>
    </div>
    
    <!-- Transfer list -->
    <div class="transfer-list">
      <div 
        v-for="item in queue" 
        :key="item.id"
        class="transfer-item"
      >
        <div class="item-info">
          <span class="item-type" :title="item.type === 'upload' ? 'Subiendo' : 'Descargando'">
            {{ item.type === 'upload' ? '⬆️' : '⬇️' }}
          </span>
          <div class="item-details">
            <span class="item-name" :title="item.fileName">{{ item.fileName }}</span>
            <span class="item-size">{{ formatSize(item.size) }}</span>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div v-if="item.status === 'in-progress'" class="item-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${item.progress}%` }"></div>
          </div>
          <span class="progress-text">{{ item.progress }}%</span>
        </div>
        
        <!-- Status -->
        <div class="item-status">
          <span :class="['status-icon', getStatusClass(item.status)]">
            {{ getStatusIcon(item.status) }}
          </span>
          
          <!-- Actions -->
          <div class="item-actions">
            <button 
              v-if="item.status === 'failed'"
              @click="transferService.retry(item.id)"
              class="item-btn"
              title="Reintentar"
            >
              🔄
            </button>
            <button 
              v-if="item.status === 'pending'"
              @click="transferService.cancel(item.id)"
              class="item-btn"
              title="Cancelar"
            >
              ❌
            </button>
            <button 
              v-if="item.status !== 'in-progress'"
              @click="transferService.remove(item.id)"
              class="item-btn"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <!-- Error message -->
        <div v-if="item.error" class="item-error">
          {{ item.error }}
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="queue.length === 0" class="empty-state">
        <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p>No hay transferencias</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transfer-panel {
  @apply flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700;
}

.panel-header {
  @apply flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700;
}

.panel-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.header-stats {
  @apply flex gap-1;
}

.stat-badge {
  @apply text-xs px-1.5 py-0.5 rounded;
}

.stat-badge.in-progress {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400;
}

.stat-badge.pending {
  @apply bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400;
}

.panel-actions {
  @apply flex gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700;
}

.action-btn {
  @apply text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
}

.action-btn.danger {
  @apply text-red-500 hover:text-red-700;
}

.transfer-list {
  @apply flex-1 overflow-y-auto;
}

.transfer-item {
  @apply p-3 border-b border-gray-100 dark:border-gray-700 last:border-0;
}

.item-info {
  @apply flex items-center gap-2;
}

.item-type {
  @apply text-lg;
}

.item-details {
  @apply flex-1 min-w-0;
}

.item-name {
  @apply block text-sm text-gray-700 dark:text-gray-200 truncate;
}

.item-size {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.item-progress {
  @apply flex items-center gap-2 mt-2;
}

.progress-bar {
  @apply flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary-500 transition-all;
}

.progress-text {
  @apply text-xs text-gray-500 dark:text-gray-400 w-10 text-right;
}

.item-status {
  @apply flex items-center justify-between mt-2;
}

.status-icon {
  @apply text-sm;
}

.item-actions {
  @apply flex gap-1;
}

.item-btn {
  @apply text-sm opacity-60 hover:opacity-100 transition-opacity;
}

.item-error {
  @apply mt-1 text-xs text-red-500 truncate;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-8;
}

.empty-state p {
  @apply mt-2 text-sm;
}
</style>
