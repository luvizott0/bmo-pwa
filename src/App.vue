<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import OfflineIndicator from '@/components/layout/OfflineIndicator.vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const capturedError = ref<string | null>(null)

onErrorCaptured((err, instance, info) => {
  console.error('Erro capturado no App.vue:', err, info)
  capturedError.value = String(err?.message || err)
  return false
})

const isAuthPage = computed(() => route.meta.requiresAuth === false || route.name === 'login')

const handleUnauthorized = () => {
  authStore.clearAuth()
  dashboardStore.resetState()
  router.push({ name: 'login' })
}

const handleRetry = () => {
  capturedError.value = null
}

const handleResetAndReload = () => {
  dashboardStore.resetState()
  capturedError.value = null
  window.location.reload()
}

onMounted(() => {
  window.addEventListener('flux:unauthorized', handleUnauthorized)
})

onUnmounted(() => {
  window.removeEventListener('flux:unauthorized', handleUnauthorized)
})
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Offline Alert / Sync Status Indicator -->
    <OfflineIndicator />

    <!-- Error Fallback Banner if a component crashes -->
    <div
      v-if="capturedError"
      class="max-w-2xl mx-auto my-8 p-6 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-4 text-center"
    >
      <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle class="w-6 h-6 stroke-[2.2]" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900">Ops! Ocorreu uma instabilidade na tela</h2>
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Um erro inesperado foi interceptado ao carregar esta visualização.
        </p>
      </div>
      <div class="bg-rose-50 text-rose-800 text-xs font-mono p-3 rounded-xl break-all text-left">
        {{ capturedError }}
      </div>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          @click="handleRetry"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Tentar Novamente</span>
        </button>
        <button
          type="button"
          @click="handleResetAndReload"
          class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Limpar Cache Local</span>
        </button>
      </div>
    </div>

    <!-- Application Shell Layout (Protected Routes) -->
    <template v-else-if="!isAuthPage">
      <div class="flex-1 flex w-full">
        <!-- Desktop Sidebar -->
        <AppSidebar />

        <!-- Main Dashboard Content Container -->
        <main class="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8 max-w-[1400px]">
          <RouterView />
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar (PWA) -->
      <MobileBottomNav />
    </template>

    <!-- Guest / Login Layout -->
    <template v-else>
      <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <RouterView />
      </main>
    </template>
  </div>
</template>
