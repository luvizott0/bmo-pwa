<script setup lang="ts">
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-vue-next'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const { isOnline, wasOffline } = useNetworkStatus(() => {
  store.syncPendingQueue()
})
</script>

<template>
  <div v-if="!isOnline" class="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm transition-all duration-300">
    <div class="flex items-center gap-2 max-w-5xl mx-auto w-full">
      <WifiOff class="w-4 h-4 shrink-0 stroke-[2.5]" />
      <span>Modo Offline: exibindo dados persistidos. Novas ações serão salvas e sincronizadas automaticamente ao reconectar.</span>
      <span v-if="store.hasOfflineChanges" class="ml-auto bg-amber-600/50 px-2 py-0.5 rounded-full text-[11px] font-bold">
        {{ store.offlineQueue.length }} alteraç{{ store.offlineQueue.length > 1 ? 'ões pendentes' : 'ão pendente' }}
      </span>
    </div>
  </div>

  <div v-else-if="wasOffline || store.isSyncing" class="bg-emerald-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all duration-300">
    <component :is="store.isSyncing ? RefreshCw : CheckCircle2" :class="['w-4 h-4 shrink-0', store.isSyncing ? 'animate-spin' : '']" />
    <span>{{ store.isSyncing ? 'Sincronizando alterações locais com o servidor...' : 'Conexão restabelecida! Dados sincronizados com sucesso.' }}</span>
  </div>
</template>
