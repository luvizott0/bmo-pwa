<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight, Plus, Landmark, CreditCard as CardIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth'
import type { BankAccount, CreditCard } from '@/types/finance'

const props = defineProps<{
  accounts: BankAccount[]
  cards?: CreditCard[]
}>()

const emit = defineEmits<{
  (e: 'addAccount'): void
}>()

const router = useRouter()
const authStore = useAuthStore()

const goToAccounts = () => {
  router.push('/accounts')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-base sm:text-lg font-bold tracking-tight text-slate-900">
        Contas Bancárias & Cartões
      </h3>
      <button
        type="button"
        @click="goToAccounts"
        class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-0.5 cursor-pointer"
      >
        <span>Gerenciar</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Cards Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 1. Bank Account Cards -->
      <div
        v-for="acc in accounts"
        :key="`acc-${acc.id}`"
        @click="goToAccounts"
        class="relative p-5 rounded-[22px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[150px] cursor-pointer"
      >
        <!-- Top row: Icon + Badge -->
        <div class="flex items-start justify-between">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
            :style="{ backgroundColor: acc.color_hex || '#2563eb' }"
          >
            <Landmark class="w-5 h-5 stroke-[2.2]" />
          </div>

          <div class="flex items-center gap-1.5">
            <span
              v-if="acc.is_primary"
              class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              PRINCIPAL
            </span>
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              DÉBITO
            </span>
          </div>
        </div>

        <!-- Bottom row: Name, Balance & Ownership -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span class="truncate">{{ acc.name }}</span>
            <span class="font-mono text-[11px]">{{ acc.account_number }}</span>
          </div>
          <p class="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {{ formatCurrency(acc.current_balance) }}
          </p>

          <!-- Owner Indicator -->
          <div class="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
            <div class="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black flex items-center justify-center shrink-0">
              {{ acc.user?.name ? acc.user.name.charAt(0).toUpperCase() : (authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U') }}
            </div>
            <span class="font-semibold text-slate-600 truncate max-w-[120px]">
              {{ (acc.user && acc.user.id === authStore.user?.id) || (!acc.user && authStore.user) ? `${acc.user?.name || authStore.user?.name} (Você)` : (acc.user?.name || 'Titular') }}
            </span>
            <span
              v-if="acc.is_shared !== false"
              class="ml-auto text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
            >
              Compartilhada
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Credit Cards -->
      <div
        v-for="card in cards"
        :key="`card-${card.id}`"
        @click="goToAccounts"
        class="relative p-5 rounded-[22px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[150px] cursor-pointer"
      >
        <!-- Top row: Icon + Badge -->
        <div class="flex items-start justify-between">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
            :style="{ backgroundColor: card.color_hex || '#ea580c' }"
          >
            <CardIcon class="w-5 h-5 stroke-[2.2]" />
          </div>

          <div class="flex items-center gap-1">
            <span
              v-if="card.bank_account"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[90px]"
            >
              {{ card.bank_account.name }}
            </span>
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
              {{ card.type === 'debit' ? 'DÉBITO' : 'CRÉDITO' }}
            </span>
          </div>
        </div>

        <!-- Bottom row: Name, Used & Available & Ownership -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span class="truncate">{{ card.name }}</span>
            <span class="text-emerald-600 font-semibold text-[11px]">Disp: {{ formatCurrency(card.available_limit) }}</span>
          </div>
          <p class="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {{ formatCurrency(card.used_limit || 0) }}
          </p>

          <!-- Owner Indicator -->
          <div class="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
            <div class="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black flex items-center justify-center shrink-0">
              {{ card.user?.name ? card.user.name.charAt(0).toUpperCase() : (authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U') }}
            </div>
            <span class="font-semibold text-slate-600 truncate max-w-[120px]">
              {{ (card.user && card.user.id === authStore.user?.id) || (!card.user && authStore.user) ? `${card.user?.name || authStore.user?.name} (Você)` : (card.user?.name || 'Titular') }}
            </span>
            <span
              v-if="card.is_shared !== false"
              class="ml-auto text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
            >
              Compartilhado
            </span>
          </div>
        </div>
      </div>

      <!-- Add Account / Card Dashed Button -->
      <button
        type="button"
        @click="goToAccounts"
        class="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-[22px] p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-all duration-200 min-h-[150px] cursor-pointer group"
      >
        <div class="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
          <Plus class="w-5 h-5 stroke-[2.5]" />
        </div>
        <span class="text-xs font-bold">Gerenciar / Adicionar Contas</span>
      </button>
    </div>
  </div>
</template>
