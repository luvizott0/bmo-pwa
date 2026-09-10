<script setup lang="ts">
import { LayoutGrid, Wallet, Settings, CalendarCheck2 } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const mobileTabs = [
  { name: 'Início', path: '/', icon: LayoutGrid },
  { name: 'Contas', path: '/accounts', icon: Wallet },
  { name: 'Despesas Fixas', path: '/fixed-expenses', icon: CalendarCheck2 },
  { name: 'Configurações', path: '/settings', icon: Settings },
]
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 pb-safe flex items-center justify-around shadow-lg shadow-slate-900/5 select-none"
  >
    <RouterLink
      v-for="tab in mobileTabs"
      :key="tab.name"
      :to="tab.path"
      :title="tab.name"
      :aria-label="tab.name"
      :class="[
        'flex items-center justify-center p-2.5 rounded-2xl transition-all duration-150',
        route.path === tab.path || (tab.path === '/fixed-expenses' && route.path === '/subscriptions')
          ? 'text-indigo-600 bg-indigo-50/80 shadow-2xs'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      ]"
    >
      <component :is="tab.icon" class="w-6 h-6 stroke-[2.2]" />
    </RouterLink>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
