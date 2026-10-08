<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  History,
  CheckCircle2,
  Receipt,
  Calendar,
  Filter,
  Users,
  Tv,
  Check,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { SubscriptionHistoryItem } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  subscriptionId?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()

const historyItems = ref<SubscriptionHistoryItem[]>([])
const isLoading = ref(false)
const selectedMonth = ref<string>('all')
const copiedId = ref<string | null>(null)

// Unique months available in history
const availableMonths = computed(() => {
  const months = new Set<string>()
  historyItems.value.forEach(item => {
    if (item.reference_month) {
      months.add(item.reference_month)
    }
  })
  return Array.from(months).sort().reverse()
})

// Filtered list
const filteredItems = computed(() => {
  if (selectedMonth.value === 'all') {
    return historyItems.value
  }
  return historyItems.value.filter(item => item.reference_month === selectedMonth.value)
})

const totalPaid = computed(() => {
  return filteredItems.value.reduce((acc, curr) => acc + (curr.amount || 0), 0)
})

const formatMonthLabel = (refMonth: string) => {
  if (!refMonth) return ''
  const parts = refMonth.split('-')
  if (parts.length < 2) return refMonth
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const monthIdx = parseInt(parts[1] || '1', 10) - 1
  return `${months[monthIdx] || parts[1]} de ${parts[0]}`
}

async function loadHistory() {
  isLoading.value = true
  try {
    const params: { subscription_id?: number } = {}
    if (props.subscriptionId) {
      params.subscription_id = props.subscriptionId
    }
    const res = await store.fetchSubscriptionsHistory(params)
    historyItems.value = res.data || []
  } catch (err) {
    console.error('Erro ao carregar histórico de assinaturas:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedMonth.value = 'all'
      loadHistory()
    }
  },
  { immediate: true }
)

async function copyPixId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    copiedId.value = id
    setTimeout(() => {
      copiedId.value = null
    }, 2500)
  } catch (e) {
    console.warn('Falha ao copiar:', e)
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <History class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0">
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
              Histórico de Assinaturas Pagas
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5 truncate">
              Registro detalhado de mensalidades e rateios liquidados
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

      <!-- Filters & Metrics Bar -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Metric Summary -->
        <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Total Liquidado
            </span>
            <span class="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight mt-0.5 block">
              {{ formatCurrency(totalPaid) }}
            </span>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800">
            {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'registro' : 'registros' }}
          </span>
        </div>

        <!-- Month Filter -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filtrar por Mês de Referência
          </label>
          <select
            v-model="selectedMonth"
            class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Todos os Meses</option>
            <option v-for="m in availableMonths" :key="m" :value="m">
              {{ formatMonthLabel(m) }} ({{ m }})
            </option>
          </select>
        </div>
      </div>

      <!-- Content Area -->
      <div class="mt-5 space-y-2.5 max-h-96 overflow-y-auto pr-1">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-10 text-center">
          <div class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs text-slate-400 font-medium mt-3">Carregando histórico...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredItems.length === 0"
          class="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
        >
          <Receipt class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h5 class="text-sm font-bold text-slate-700">
            Nenhum pagamento registrado
          </h5>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Quando as assinaturas ou participações forem marcadas como pagas (manualmente ou pelo robô de WhatsApp), o histórico completo aparecerá aqui.
          </p>
        </div>

        <!-- Items List -->
        <div
          v-else
          v-for="item in filteredItems"
          :key="item.id"
          class="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition shadow-2xs space-y-2"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs"
                :style="{ backgroundColor: item.subscription_color || '#6366f1' }"
              >
                {{ item.subscription_name.slice(0, 3).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h5 class="text-sm font-bold text-slate-900 truncate">
                    {{ item.subscription_name }}
                  </h5>
                  <span
                    v-if="item.type === 'shared_member'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 shrink-0"
                  >
                    Rateio
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 shrink-0"
                  >
                    Individual
                  </span>
                </div>
                <p class="text-xs text-slate-500 font-medium truncate mt-0.5">
                  <span class="font-bold text-slate-700">{{ item.member_name }}</span>
                  <span v-if="item.member_contact"> ({{ item.member_contact }})</span>
                  <span> • Ref: {{ item.reference_month }}</span>
                </p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-sm sm:text-base font-black text-slate-900 block">
                {{ formatCurrency(item.amount) }}
              </span>
              <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                <CheckCircle2 class="w-3 h-3" />
                <span>Liquidado</span>
              </span>
            </div>
          </div>

          <!-- Bottom Meta Details -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            <div class="flex items-center gap-2">
              <Calendar class="w-3.5 h-3.5" />
              <span>Data: {{ formatDate(item.payment_date) }}</span>
              <span>•</span>
              <span>Meio: {{ item.payment_method }}</span>
            </div>

            <!-- Pix Auth ID if available -->
            <div v-if="item.pix_e2e_id" class="flex items-center gap-1 font-mono text-[10px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <span>Pix: {{ item.pix_e2e_id.slice(0, 12) }}...</span>
              <button
                type="button"
                @click="copyPixId(item.pix_e2e_id)"
                class="hover:text-slate-800 transition cursor-pointer"
                title="Copiar ID de autenticação Pix"
              >
                <Check v-if="copiedId === item.pix_e2e_id" class="w-3 h-3 text-emerald-600" />
                <Copy v-else class="w-3 h-3" />
              </button>
            </div>
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
