<script setup lang="ts">
import { computed } from 'vue'
import {
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  CheckCircle2,
  DollarSign,
} from 'lucide-vue-next'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { FixedBill } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  bill: FixedBill | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const historyPayments = computed(() => {
  if (!props.bill || !props.bill.payments) return []
  return [...props.bill.payments].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
})

const totalPaid = computed(() => {
  return historyPayments.value.reduce((acc, curr) => acc + (curr.amount || 0), 0)
})

const averagePaid = computed(() => {
  if (historyPayments.value.length === 0) return 0
  return Math.round((totalPaid.value / historyPayments.value.length) * 100) / 100
})

const maxPayment = computed(() => {
  if (historyPayments.value.length === 0) return null
  const first = historyPayments.value[0]
  if (!first) return null
  return historyPayments.value.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), first)
})

const minPayment = computed(() => {
  if (historyPayments.value.length === 0) return null
  const first = historyPayments.value[0]
  if (!first) return null
  return historyPayments.value.reduce((prev, curr) => (curr.amount < prev.amount ? curr : prev), first)
})

const chartMax = computed(() => {
  if (historyPayments.value.length === 0) return 100
  const max = Math.max(...historyPayments.value.map(p => p.amount))
  return max > 0 ? max * 1.15 : 100
})

// Chronological (oldest to newest) for chart bars
const chronologicalPayments = computed(() => {
  return [...historyPayments.value].reverse()
})

const formatMonthLabel = (refMonth: string) => {
  if (!refMonth) return ''
  const parts = refMonth.split('-')
  if (parts.length < 2) return refMonth
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthIdx = parseInt(parts[1] || '1', 10) - 1
  return `${months[monthIdx] || parts[1]}/${parts[0]?.slice(2)}`
}
</script>

<template>
  <div
    v-if="isOpen && bill"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            :style="{ backgroundColor: bill.color_hex || '#3b82f6' }"
          >
            <BarChart3 class="w-5 h-5 stroke-[2.5]" />
          </div>
          <div class="min-w-0">
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
              Histórico • {{ bill.name }}
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
              Acompanhe a variação do custo e pagamentos mês a mês
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="mt-6 space-y-6">
        <!-- Summary Stat Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Média -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Média Mensal
            </span>
            <span class="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {{ formatCurrency(averagePaid) }}
            </span>
          </div>

          <!-- Total Pago -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pago
            </span>
            <span class="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {{ formatCurrency(totalPaid) }}
            </span>
          </div>

          <!-- Maior Valor -->
          <div class="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
            <span class="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Maior Fatura
            </span>
            <span class="text-base sm:text-lg font-black text-rose-800 mt-0.5 block">
              {{ maxPayment ? formatCurrency(maxPayment.amount) : 'R$ 0,00' }}
            </span>
          </div>

          <!-- Menor Valor -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Menor Fatura
            </span>
            <span class="text-base sm:text-lg font-black text-emerald-800 mt-0.5 block">
              {{ minPayment ? formatCurrency(minPayment.amount) : 'R$ 0,00' }}
            </span>
          </div>
        </div>

        <!-- Monthly Comparison Chart (if we have 2 or more payments) -->
        <div v-if="chronologicalPayments.length >= 2" class="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Evolução do Custo Mês a Mês
            </h4>
            <span class="text-xs font-medium text-slate-400">
              {{ chronologicalPayments.length }} registros
            </span>
          </div>

          <!-- Bar Chart -->
          <div class="h-40 flex items-end justify-between gap-2 pt-6 px-2">
            <div
              v-for="p in chronologicalPayments"
              :key="p.id"
              class="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
            >
              <!-- Tooltip on hover -->
              <span class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-md whitespace-nowrap pointer-events-none z-10">
                {{ formatCurrency(p.amount) }}
              </span>

              <!-- Bar -->
              <div
                class="w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:brightness-95"
                :style="{
                  height: `${Math.max(12, (p.amount / chartMax) * 100)}%`,
                  backgroundColor: bill.color_hex || '#3b82f6',
                }"
              />

              <!-- Month label -->
              <span class="text-[10px] font-bold text-slate-500 shrink-0">
                {{ formatMonthLabel(p.reference_month) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Payment History List -->
        <div>
          <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
            Registro de Pagamentos
          </h4>

          <div v-if="historyPayments.length > 0" class="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
            <div
              v-for="payment in historyPayments"
              :key="payment.id"
              class="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 class="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h5 class="text-sm font-bold text-slate-900 leading-tight">
                    Mês de Referência: {{ formatMonthLabel(payment.reference_month) }}
                  </h5>
                  <span class="text-xs text-slate-400 font-medium">
                    Pago em {{ formatDate(payment.occurred_at) }}
                  </span>
                </div>
              </div>

              <div class="text-right">
                <span class="text-sm font-black text-slate-900 block">
                  {{ formatCurrency(payment.amount) }}
                </span>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Liquidado
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
          >
            <Receipt class="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h5 class="text-sm font-bold text-slate-700">
              Nenhum pagamento registrado ainda
            </h5>
            <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Ao marcar esta conta como paga a cada mês, os valores e datas ficarão salvos aqui, permitindo comparar a variação dos custos ao longo do tempo.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
