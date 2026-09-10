<script setup lang="ts">
import { LayoutGrid, Wallet, RefreshCw, Settings } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const mobileTabs = [
  { name: 'Início', path: '/', icon: LayoutGrid },
  { name: 'Contas', path: '/accounts', icon: Wallet },
  { name: 'Rateio', path: '/subscriptions', icon: RefreshCw },
  { name: 'Configurações', path: '/settings', icon: Settings },
]
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-2 pb-safe flex items-center justify-around shadow-lg shadow-slate-900/5 select-none"
  >
    <RouterLink
      v-for="tab in mobileTabs"
      :key="tab.name"
      :to="tab.path"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-4 text-xs font-semibold transition-all duration-150',
        route.path === tab.path
          ? 'text-indigo-600'
          : 'text-slate-400 hover:text-slate-600'
      ]"
    >
      <component :is="tab.icon" class="w-5 h-5 stroke-[2.2]" />
      <span class="text-[11px]">{{ tab.name }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
