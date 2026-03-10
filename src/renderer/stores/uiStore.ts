import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

export const useUIStore = defineStore('ui', () => {
  // State
  const notifications = ref<Notification[]>([])
  const activeModal = ref<string | null>(null)
  const selectedLocalItems = ref<string[]>([])
  const selectedRemoteItems = ref<string[]>([])
  const isTransferPanelOpen = ref(false)

  // Computed
  const hasSelectedItems = computed(() => 
    selectedLocalItems.value.length > 0 || selectedRemoteItems.value.length > 0
  )

  const totalSelectedCount = computed(() =>
    selectedLocalItems.value.length + selectedRemoteItems.value.length
  )

  // Actions
  function notify(notification: Omit<Notification, 'id'>): void {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const duration = notification.duration ?? 5000

    notifications.value.push({ ...notification, id })

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  function removeNotification(id: string): void {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications(): void {
    notifications.value = []
  }

  function openModal(modalId: string): void {
    activeModal.value = modalId
  }

  function closeModal(): void {
    activeModal.value = null
  }

  function selectLocalItem(path: string, multi = false): void {
    if (multi) {
      const index = selectedLocalItems.value.indexOf(path)
      if (index > -1) {
        selectedLocalItems.value.splice(index, 1)
      } else {
        selectedLocalItems.value.push(path)
      }
    } else {
      selectedLocalItems.value = [path]
    }
  }

  function selectRemoteItem(key: string, multi = false): void {
    if (multi) {
      const index = selectedRemoteItems.value.indexOf(key)
      if (index > -1) {
        selectedRemoteItems.value.splice(index, 1)
      } else {
        selectedRemoteItems.value.push(key)
      }
    } else {
      selectedRemoteItems.value = [key]
    }
  }

  function clearLocalSelection(): void {
    selectedLocalItems.value = []
  }

  function clearRemoteSelection(): void {
    selectedRemoteItems.value = []
  }

  function clearAllSelections(): void {
    selectedLocalItems.value = []
    selectedRemoteItems.value = []
  }

  function toggleTransferPanel(): void {
    isTransferPanelOpen.value = !isTransferPanelOpen.value
  }

  return {
    notifications,
    activeModal,
    selectedLocalItems,
    selectedRemoteItems,
    isTransferPanelOpen,
    hasSelectedItems,
    totalSelectedCount,
    notify,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal,
    selectLocalItem,
    selectRemoteItem,
    clearLocalSelection,
    clearRemoteSelection,
    clearAllSelections,
    toggleTransferPanel
  }
})
