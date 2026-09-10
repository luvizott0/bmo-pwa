<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  ArrowRight,
  CreditCard as CreditCardIcon,
  Building2,
  ReceiptText,
} from 'lucide-vue-next'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { TransactionItem } from '@/types/finance'

const props = defineProps<{
  transactions?: TransactionItem[]
}>()

const router = useRouter()

const displayedTransactions = computed(() => {
  return (props.transactions || []).slice(0, 5)
})

const navigateToAll = () => {
  router.push('/transactions')
}
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-5">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <ReceiptText class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Últimas Transações
          </h3>
          <p class="text-xs text-slate-400 font-medium">
            Extrato recente das suas finanças
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="navigateToAll"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
      >
        <span>Visualizar tudo</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Transactions List -->
    <div v-if="displayedTransactions.length > 0" class="divide-y divide-slate-100">
      <div
        v-for="tx in displayedTransactions"
        :key="tx.id"
        class="py-3 sm:py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors"
      >
        <!-- Left: Icon & Info -->
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Icon -->
          <div
            :class="[
              'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs',
              tx.installment_number || tx.installment_group_id
                ? 'bg-purple-50 text-purple-600'
                : tx.type === 'income'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            ]"
          >
            <Layers v-if="tx.installment_number || tx.installment_group_id" class="w-5 h-5" />
            <ArrowDownLeft v-else-if="tx.type === 'income'" class="w-5 h-5" />
            <ArrowUpRight v-else class="w-5 h-5" />
          </div>

          <!-- Description & Meta -->
          <div class="truncate">
            <div class="flex items-center gap-2 truncate">
              <h4 class="text-sm font-bold text-slate-900 truncate">
                {{ tx.description || (tx.type === 'income' ? 'Receita' : 'Despesa') }}
              </h4>

              <!-- Installment badge -->
              <span
                v-if="tx.installment_number && tx.total_installments"
                class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60"
              >
                {{ tx.installment_number }}/{{ tx.total_installments }}
              </span>
            </div>

            <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium truncate">
              <span>{{ formatDate(tx.occurred_at) }}</span>

              <span v-if="tx.credit_card" class="inline-flex items-center gap-1 text-slate-500 font-semibold truncate">
                <span>•</span>
                <CreditCardIcon class="w-3 h-3 text-slate-400" />
                <span class="truncate">{{ tx.credit_card.name }}</span>
              </span>
              <span v-else-if="tx.bank_account" class="inline-flex items-center gap-1 text-slate-500 font-semibold truncate">
                <span>•</span>
                <Building2 class="w-3 h-3 text-slate-400" />
                <span class="truncate">{{ tx.bank_account.name }}</span>
              </span>

              <span v-if="tx.category" class="truncate text-slate-400 hidden sm:inline">
                • {{ tx.category.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Amount -->
        <div class="text-right shrink-0">
          <span
            :class="[
              'text-sm font-bold block',
              tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
            ]"
          >
            {{ tx.type === 'income' ? '+' : '-' }} {{ formatCurrency(tx.amount) }}
          </span>

          <span
            v-if="tx.status === 'pending'"
            class="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md"
          >
            Pendente
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="py-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
    >
      <ReceiptText class="w-8 h-8 text-slate-300 mb-2" />
      <p class="text-xs font-bold text-slate-600">Nenhuma movimentação recente</p>
      <p class="text-[11px] text-slate-400 mt-0.5">Suas novas receitas e despesas aparecerão aqui.</p>
    </div>
  </div>
</template>
