<script setup lang="ts">
import { computed } from 'vue'
import {
  Droplets,
  Zap,
  Wifi,
  Home,
  Building,
  Flame,
  Receipt,
  Check,
  RotateCcw,
  Clock,
  Trash2,
  Building2,
} from 'lucide-vue-next'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { FixedBill } from '@/types/finance'

const props = defineProps<{
  bill: FixedBill
}>()

const emit = defineEmits<{
  (e: 'pay', bill: FixedBill): void
  (e: 'unpay', billId: number): void
  (e: 'viewHistory', bill: FixedBill): void
  (e: 'delete', billId: number): void
}>()

const iconComponent = computed(() => {
  const lower = props.bill.name.toLowerCase()
  if (
    lower.includes('água') ||
    lower.includes('agua') ||
    lower.includes('water') ||
    lower.includes('sanepar') ||
    lower.includes('sabesp') ||
    lower.includes('copasa')
  ) {
    return Droplets
  }
  if (
    lower.includes('luz') ||
    lower.includes('energia') ||
    lower.includes('elétr') ||
    lower.includes('eletri') ||
    lower.includes('enel') ||
    lower.includes('cemig') ||
    lower.includes('copel') ||
    lower.includes('cpfl')
  ) {
    return Zap
  }
  if (
    lower.includes('internet') ||
    lower.includes('fibra') ||
    lower.includes('wifi') ||
    lower.includes('banda larga') ||
    lower.includes('claro') ||
    lower.includes('vivo')
  ) {
    return Wifi
  }
  if (lower.includes('aluguel') || lower.includes('rent') || lower.includes('moradia')) {
    return Home
  }
  if (lower.includes('condom') || lower.includes('condomínio')) {
    return Building
  }
  if (lower.includes('gás') || lower.includes('gas')) {
    return Flame
  }
  return Receipt
})

const isVariableCost = computed(() => {
  const lower = props.bill.name.toLowerCase()
  return (
    lower.includes('água') ||
    lower.includes('agua') ||
    lower.includes('luz') ||
    lower.includes('energia') ||
    lower.includes('gás') ||
    lower.includes('gas')
  )
})

const dueDaysDiff = computed(() => {
  const today = new Date().getDate()
  return props.bill.due_day - today
})

const dueText = computed(() => {
  const diff = dueDaysDiff.value
  if (diff === 0) return 'Vence hoje'
  if (diff > 0) return `Vence dia ${props.bill.due_day} (em ${diff}d)`
  return `Venceu dia ${props.bill.due_day} (${Math.abs(diff)}d atrás)`
})

const currentAmount = computed(() => {
  if (props.bill.is_paid && props.bill.current_payment?.amount) {
    return props.bill.current_payment.amount
  }
  return props.bill.estimated_amount
})

const paymentsCount = computed(() => {
  return props.bill.payments?.length || 0
})
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
    <!-- Top Section -->
    <div>
      <div class="flex items-start justify-between gap-3">
        <!-- Left: Icon & Info -->
        <div class="flex items-start gap-3.5 min-w-0">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs transition-transform"
            :style="{ backgroundColor: bill.color_hex || '#3b82f6' }"
          >
            <component :is="iconComponent" class="w-6 h-6 stroke-[2.2]" />
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                {{ bill.name }}
              </h3>

              <span
                v-if="isVariableCost"
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 tracking-wider uppercase border border-amber-100"
                title="O valor desta conta varia de acordo com o consumo no mês"
              >
                Custo Variável
              </span>
            </div>

            <!-- Subtitle info -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
              <span>{{ bill.category?.name || 'Conta Fixa' }}</span>
              <span>•</span>
              <span :class="bill.is_paid ? 'text-slate-400' : (dueDaysDiff <= 0 ? 'text-rose-600 font-bold' : 'text-slate-600 font-semibold')">
                {{ dueText }}
              </span>

              <template v-if="bill.preferred_bank_account">
                <span>•</span>
                <span class="inline-flex items-center gap-1 text-slate-600 font-semibold">
                  <Building2 class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ bill.preferred_bank_account.name }}</span>
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- Right: Amount & Delete -->
        <div class="text-right shrink-0 flex flex-col items-end">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'text-xl sm:text-2xl font-black tracking-tight transition-colors',
                bill.is_paid ? 'text-emerald-600' : 'text-slate-900'
              ]"
            >
              {{ formatCurrency(currentAmount) }}
            </span>
            <button
              type="button"
              @click="emit('delete', bill.id)"
              title="Excluir despesa fixa"
              class="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {{ bill.is_paid ? 'Valor Pago no Mês' : (isVariableCost ? 'Valor Estimado' : 'Valor Mensal') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Actions & Status Row -->
    <div class="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Status Box -->
      <div v-if="bill.is_paid" class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100/90 text-emerald-800 text-xs font-bold">
        <div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
          <Check class="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <div>
          <span>Pago neste ciclo</span>
          <span v-if="bill.current_payment?.occurred_at" class="text-emerald-600/90 font-medium ml-1">
            ({{ formatDate(bill.current_payment.occurred_at) }})
          </span>
        </div>
      </div>

      <div v-else class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs font-semibold">
        <span class="w-2.5 h-2.5 rounded-full" :class="dueDaysDiff <= 0 ? 'bg-rose-500 animate-pulse' : (dueDaysDiff <= 3 ? 'bg-amber-500' : 'bg-slate-300')" />
        <span>{{ dueDaysDiff <= 0 ? 'Pagamento pendente / urgente' : 'Aguardando pagamento' }}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <!-- History button -->
        <button
          type="button"
          @click="emit('viewHistory', bill)"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
          title="Ver histórico de valores mês a mês"
        >
          <Clock class="w-3.5 h-3.5 text-slate-400" />
          <span>Histórico ({{ paymentsCount }})</span>
        </button>

        <!-- Unpay button (if paid) -->
        <button
          v-if="bill.is_paid"
          type="button"
          @click="emit('unpay', bill.id)"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200/80 transition cursor-pointer"
          title="Desmarcar como paga e reverter saldo"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Desmarcar</span>
        </button>

        <!-- Pay Button (if pending) -->
        <button
          v-else
          type="button"
          @click="emit('pay', bill)"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20 transition cursor-pointer"
        >
          <Check class="w-3.5 h-3.5 stroke-[3]" />
          <span>Marcar como Paga</span>
        </button>
      </div>
    </div>
  </div>
</template>
