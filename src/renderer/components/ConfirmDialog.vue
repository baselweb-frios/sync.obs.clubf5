<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIStore } from '../stores/uiStore'

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}>(), {
  title: 'Confirmar',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  type: 'info'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const typeColors = {
  info: 'bg-primary-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500'
}

const typeIcons = {
  info: '❓',
  warning: '⚠️',
  danger: '🗑️'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="confirm-overlay" @click.self="emit('cancel')">
        <div class="confirm-modal">
          <div class="confirm-icon" :class="typeColors[type]">
            {{ typeIcons[type] }}
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button @click="emit('cancel')" class="btn btn-secondary">
              {{ cancelText }}
            </button>
            <button 
              @click="emit('confirm')" 
              :class="['btn', type === 'danger' ? 'btn-danger' : 'btn-primary']"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.confirm-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm text-center;
}

.confirm-icon {
  @apply w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl text-white;
}

.confirm-title {
  @apply mt-4 text-lg font-semibold text-gray-800 dark:text-white;
}

.confirm-message {
  @apply mt-2 text-sm text-gray-600 dark:text-gray-400;
}

.confirm-actions {
  @apply mt-6 flex gap-3 justify-center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
