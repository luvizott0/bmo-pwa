<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Calendar, CreditCard as CardIcon, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import type { CreditCard, MonthlyCardLimit } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  card: CreditCard | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()
const isLoading = ref(false)
const monthlyLimits = ref<MonthlyCardLimit[]>([])

const loadLimits = async () => {
  if (!props.card) return
  isLoading.value = true
  try {
    monthlyLimits.value = await store.fetchCardMonthlyLimits(props.card.id, 12)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.card) {
      loadLimits()
    }
  },
  { immediate: true }
)

const formatMonthYear = (monthYear: string) => {
  if (!monthYear) return ''
  const [year, month] = monthYear.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`
}

const formatDueDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}
</script>

<template>
  <div
    v-if="isOpen && card"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-3">
          <div
            class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
            :style="{ backgroundColor: card.color_hex || '#ea580c' }"
          >
            <CardIcon class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 leading-tight">
              Evolução do Limite Mês a Mês
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ card.name }} • {{ card.brand }}
              <span v-if="card.bank_account" class="ml-1 text-indigo-600 font-semibold">
                ({{ card.bank_account.name }})
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Card Summary Banner -->
      <div class="p-6 bg-slate-50/70 border-b border-slate-100 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Limite Total</span>
          <p class="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
            {{ formatCurrency(card.total_limit) }}
          </p>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Disponível Atual</span>
          <p class="text-base sm:text-lg font-black text-emerald-600 font-mono mt-0.5">
            {{ formatCurrency(card.available_limit) }}
          </p>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Fechamento</span>
          <p class="text-base sm:text-lg font-black text-slate-800 font-mono mt-0.5">
            Dia {{ card.closing_day }}
          </p>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Vencimento</span>
          <p class="text-base sm:text-lg font-black text-rose-600 font-mono mt-0.5">
            Dia {{ card.due_day }}
          </p>
        </div>
      </div>

      <!-- Informative hint banner -->
      <div class="px-6 py-3 bg-indigo-50/60 border-b border-indigo-100/50 flex items-center gap-2 text-xs text-indigo-700 shrink-0">
        <ShieldCheck class="w-4 h-4 shrink-0" />
        <span>
          O limite disponível é recuperado mês a mês conforme as parcelas das faturas vão sendo pagas.
        </span>
      </div>

      <!-- Scrollable Limits Content -->
      <div class="p-6 overflow-y-auto space-y-3">
        <!-- Loading State -->
        <div v-if="isLoading" class="py-12 text-center text-slate-400 space-y-2">
          <div class="w-8 h-8 mx-auto border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p class="text-xs font-semibold">Calculando projeção mensal do limite...</p>
        </div>

        <!-- Monthly Limits List -->
        <template v-else-if="monthlyLimits.length > 0">
          <div
            v-for="(item, index) in monthlyLimits"
            :key="item.month_year"
            class="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-slate-200 transition space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {{ index + 1 }}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">
                    {{ formatMonthYear(item.month_year) }}
                  </h4>
                  <p class="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar class="w-3 h-3" />
                    Vencimento: {{ formatDueDate(item.due_date) }}
                  </p>
                </div>
              </div>

              <!-- Invoice Amount Tag -->
              <div class="text-right">
                <span class="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Fatura do Mês
                </span>
                <span
                  :class="[
                    'text-sm font-black font-mono',
                    item.invoice_amount > 0 ? 'text-rose-600' : 'text-slate-400'
                  ]"
                >
                  {{ formatCurrency(item.invoice_amount) }}
                </span>
              </div>
            </div>

            <!-- Limits row -->
            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 text-xs">
              <div>
                <span class="text-slate-400 font-medium">Limite Bloqueado:</span>
                <span class="font-bold text-slate-700 font-mono ml-1.5">
                  {{ formatCurrency(item.blocked_limit) }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 font-medium">Limite Disponível:</span>
                <span class="font-bold text-emerald-600 font-mono ml-1.5">
                  {{ formatCurrency(item.available_limit) }}
                </span>
              </div>
            </div>

            <!-- Utilization Progress Bar -->
            <div>
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Utilização do Limite</span>
                <span class="font-bold font-mono text-slate-700">{{ item.utilization_percentage }}%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  :class="[
                    'h-full rounded-full transition-all duration-300',
                    item.utilization_percentage > 80
                      ? 'bg-rose-500'
                      : item.utilization_percentage > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  ]"
                  :style="{ width: `${Math.min(100, item.utilization_percentage)}%` }"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="py-12 text-center text-slate-400">
          <TrendingUp class="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
          <p class="text-sm font-bold text-slate-600">Nenhum dado de limite disponível</p>
          <p class="text-xs text-slate-400 mt-0.5">As compras parceladas e transações aparecerão aqui.</p>
        </div>
      </div>
    </div>
  </div>
</template>
