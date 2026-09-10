<script setup lang="ts">
import { LayoutDashboard, Landmark, BarChart3, Settings, ReceiptText, CalendarCheck2, Package } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const route = useRoute()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Extrato', path: '/transactions', icon: ReceiptText },
  { name: 'Contas Bancárias', path: '/accounts', icon: Landmark },
  { name: 'Despesas Fixas', path: '/fixed-expenses', icon: CalendarCheck2 },
  { name: 'Estoque', path: '/inventory', icon: Package },
  { name: 'Relatórios', path: '/analytics', icon: BarChart3, badge: 'EM BREVE' },
]
</script>

<template>
  <aside
    class="hidden lg:flex flex-col justify-between w-64 min-h-screen bg-white border-r border-slate-100 px-6 py-7 select-none shrink-0"
  >
    <!-- Top Brand & Navigation -->
    <div class="space-y-8">
      <!-- BMO Logo -->
      <div class="flex items-center gap-3 px-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-200">
          B
        </div>
        <span class="font-extrabold text-xl tracking-tight text-slate-900">BMO</span>
      </div>

      <!-- Nav Links -->
      <nav class="space-y-1.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          :class="[
            'flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150',
            route.path === item.path
              ? 'bg-indigo-50/90 text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          <div class="flex items-center gap-3.5">
            <component :is="item.icon" class="w-5 h-5 stroke-[2.2]" />
            <span>{{ item.name }}</span>
          </div>

          <!-- Soon Badge -->
          <span
            v-if="item.badge"
            class="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-400"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </nav>
    </div>

    <!-- Bottom Settings & Account Section -->
    <div class="pt-4 border-t border-slate-100">
      <RouterLink
        to="/settings"
        :class="[
          'flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-150',
          route.path === '/settings'
            ? 'bg-indigo-50/90 text-indigo-600 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        ]"
      >
        <div class="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-extrabold text-sm shrink-0">
          {{ (authStore.user?.name || dashboardStore.summary.user_name || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-xs font-bold truncate text-slate-800">
            {{ authStore.user?.name || dashboardStore.summary.user_name || 'Minha Conta' }}
          </p>
          <p class="text-[11px] text-slate-400 truncate font-medium">
            Configurações
          </p>
        </div>
        <Settings class="w-4 h-4 text-slate-400 stroke-[2] shrink-0" />
      </RouterLink>
    </div>
  </aside>
</template>
