import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const wasOffline = ref(false)
const lastOnlineTime = ref<Date | null>(new Date())

export function useNetworkStatus(onReconnect?: () => void) {
  const handleOnline = () => {
    isOnline.value = true
    lastOnlineTime.value = new Date()
    if (wasOffline.value) {
      if (onReconnect) {
        onReconnect()
      }
      setTimeout(() => {
        wasOffline.value = false
      }, 4000)
    }
  }

  const handleOffline = () => {
    isOnline.value = false
    wasOffline.value = true
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline,
    wasOffline,
    lastOnlineTime,
  }
}
