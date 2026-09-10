<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  X,
  ShoppingCart,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Package,
  Sparkles,
  History,
} from 'lucide-vue-next'
import { inventoryService } from '@/services/inventoryService'
import { formatFullDate } from '@/utils/formatters'
import type { InventoryItem } from '@/types/inventory'

const props = defineProps<{
  isOpen: boolean
  item: InventoryItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restocked'): void
}>()

const purchasedAt = ref<string>('')
const quantity = ref<number>(1)
const unitPrice = ref<number | null>(null)
const durationDays = ref<number | null>(null)
const isCustomDuration = ref(false)
const notes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Automatic cycle duration calculation based on last_purchased_at and purchasedAt
const autoDurationDays = computed(() => {
  if (!props.item?.last_purchased_at || !purchasedAt.value) return null
  try {
    const prevDate = new Date(`${props.item.last_purchased_at}T00:00:00`)
    const newDate = new Date(`${purchasedAt.value}T00:00:00`)
    const diffTime = newDate.getTime() - prevDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : null
  } catch {
    return null
  }
})

// Sync durationDays with auto calculation unless user manually overwrote it
watch(autoDurationDays, (newVal) => {
  if (!isCustomDuration.value && newVal !== null) {
    durationDays.value = newVal
  }
})

function resetForm() {
  const today = new Date().toISOString().split('T')[0] ?? ''
  purchasedAt.value = today
  quantity.value = 1
  unitPrice.value =
    props.item?.last_price !== null && props.item?.last_price !== undefined
      ? Number(props.item.last_price)
      : null
  notes.value = ''
  errorMessage.value = null
  isCustomDuration.value = false

  // Set durationDays to auto calculation or fallback to item's average
  if (autoDurationDays.value !== null) {
    durationDays.value = autoDurationDays.value
  } else if (props.item?.duration_days) {
    durationDays.value = Number(props.item.duration_days)
  } else {
    durationDays.value = null
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

const handleSubmit = async () => {
  if (!props.item) return

  if (
    !purchasedAt.value ||
    !quantity.value ||
    quantity.value <= 0 ||
    unitPrice.value === null ||
    unitPrice.value === undefined ||
    unitPrice.value < 0
  ) {
    errorMessage.value = 'Preencha a data, quantidade comprada e o valor unitário pago.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    await inventoryService.recordPurchase(props.item.id, {
      purchased_at: purchasedAt.value,
      quantity: Number(quantity.value),
      unit_price: Number(unitPrice.value),
      duration_days: durationDays.value ? Number(durationDays.value) : null,
      notes: notes.value.trim() || null,
    })

    emit('restocked')
    emit('close')
  } catch (err: any) {
    console.error('Erro ao reabastecer item:', err)
    errorMessage.value = err?.message || 'Falha ao registrar compra. Verifique os valores inseridos.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && item"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingCart class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 leading-tight">
              Registrar Compra / Repor Estoque
            </h3>
            <p class="text-xs text-slate-400 font-medium">
              {{ item.name }} {{ item.brand ? `(${item.brand})` : '' }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2.5"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Automatic Cycle Duration Info Card -->
        <div
          v-if="item.last_purchased_at && autoDurationDays"
          class="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="font-bold text-indigo-950 truncate">
                Duração de ciclo calculada: <span class="text-indigo-600 text-sm font-black">{{ autoDurationDays }} dias</span>
              </p>
              <p class="text-[11px] text-indigo-500 font-medium">
                De {{ formatFullDate(item.last_purchased_at) }} até {{ formatFullDate(purchasedAt) }}
              </p>
            </div>
          </div>

          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider shrink-0">
            Automático
          </span>
        </div>

        <div
          v-else-if="item.last_purchased_at"
          class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium"
        >
          <History class="w-4 h-4 text-slate-400 shrink-0" />
          <span>Última compra registrada em <strong>{{ formatFullDate(item.last_purchased_at) }}</strong>.</span>
        </div>

        <!-- Data da Compra & Quantidade Comprada -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Data da Nova Compra *
            </label>
            <div class="relative">
              <Calendar class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="purchasedAt"
                type="date"
                required
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Quantidade Comprada ({{ item.unit || 'un' }}) *
            </label>
            <div class="relative">
              <Package class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="quantity"
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="1"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Valor Unitário Pago & Duração -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Valor Pago por Unidade (R$) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                v-model="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
            <p class="text-[11px] text-slate-400 font-medium">
              Atualiza o último preço e recalcula a média
            </p>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Duração do Ciclo (dias)
              </label>
              <span
                v-if="autoDurationDays && !isCustomDuration"
                class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded"
              >
                Auto
              </span>
            </div>
            <div class="relative">
              <Clock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="durationDays"
                @input="isCustomDuration = true"
                type="number"
                min="1"
                placeholder="Ex: 30"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
            <p class="text-[11px] text-slate-400 font-medium">
              Calculada da última compra até a data atual
            </p>
          </div>
        </div>

        <!-- Observações -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Local de Compra / Observações
          </label>
          <input
            v-model="notes"
            type="text"
            placeholder="Ex: Supermercado Pão de Açúcar, Promoção leve 2 pague 1"
            class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <!-- Total Preview -->
        <div
          v-if="quantity && unitPrice"
          class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-bold"
        >
          <span class="text-slate-500">Valor Total desta Compra:</span>
          <span class="text-slate-900 text-sm font-black">
            R$ {{ (Number(quantity) * Number(unitPrice)).toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="emit('close')"
            class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold shadow-sm shadow-emerald-600/20 transition cursor-pointer inline-flex items-center gap-2"
          >
            <span v-if="isSubmitting">Registrando...</span>
            <span v-else>Confirmar Reposição</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
