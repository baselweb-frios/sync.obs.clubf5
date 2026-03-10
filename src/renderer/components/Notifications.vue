<script setup lang="ts">
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <div class="notifications">
    <TransitionGroup name="notification">
      <div 
        v-for="notification in uiStore.notifications" 
        :key="notification.id"
        :class="['notification', notification.type]"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✓</span>
          <span v-else-if="notification.type === 'error'">✕</span>
          <span v-else-if="notification.type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="notification-content">
          <p class="notification-title">{{ notification.title }}</p>
          <p v-if="notification.message" class="notification-message">{{ notification.message }}</p>
        </div>
        <button @click="uiStore.removeNotification(notification.id)" class="notification-close">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notifications {
  @apply fixed top-12 right-4 z-50 space-y-2 max-w-sm;
}

.notification {
  @apply flex items-start gap-3 p-3 rounded-lg shadow-lg;
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
}

.notification.success {
  @apply border-l-4 border-l-green-500;
}

.notification.error {
  @apply border-l-4 border-l-red-500;
}

.notification.warning {
  @apply border-l-4 border-l-yellow-500;
}

.notification.info {
  @apply border-l-4 border-l-blue-500;
}

.notification-icon {
  @apply flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold;
}

.notification.success .notification-icon {
  @apply bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400;
}

.notification.error .notification-icon {
  @apply bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400;
}

.notification.warning .notification-icon {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400;
}

.notification.info .notification-icon {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400;
}

.notification-content {
  @apply flex-1 min-w-0;
}

.notification-title {
  @apply text-sm font-medium text-gray-800 dark:text-white;
}

.notification-message {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-0.5;
}

.notification-close {
  @apply flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200;
}

/* Transitions */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.2s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.2s ease;
}
</style>
