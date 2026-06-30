<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  submit: [name: string]
}>()

const folderName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function handleSubmit() {
  const name = folderName.value.trim()
  if (name) {
    emit('submit', name)
    folderName.value = ''
  }
}

// Focus input on mount
setTimeout(() => {
  inputRef.value?.focus()
}, 100)
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog-modal">
      <div class="dialog-header">
        <h3 class="dialog-title">Nueva carpeta</h3>
        <button @click="emit('close')" class="close-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="form-group">
          <label class="form-label">Nombre de la carpeta</label>
          <input 
            ref="inputRef"
            v-model="folderName" 
            @keyup.enter="handleSubmit"
            type="text" 
            class="input"
            placeholder="Mi carpeta"
          />
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="emit('close')" class="btn btn-secondary">Cancelar</button>
        <button @click="handleSubmit" :disabled="!folderName.trim()" class="btn btn-primary">
          Crear
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.dialog-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md;
}

.dialog-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700;
}

.dialog-title {
  @apply text-lg font-semibold text-gray-800 dark:text-white;
}

.close-btn {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700;
}

.dialog-content {
  @apply p-4;
}

.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-200;
}

.dialog-actions {
  @apply flex gap-2 justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700;
}
</style>
