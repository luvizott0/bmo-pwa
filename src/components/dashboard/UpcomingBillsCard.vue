<script setup lang="ts">
import { Check, CheckCircle2 } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatters'
import type { FixedBill } from '@/types/finance'

defineProps<{
  bills: FixedBill[]
}>()

const emit = defineEmits<{
  (e: 'togglePaid', billId: number): void
}>()

const getDotColor = (bill: FixedBill) => {
  if (bill.is_paid) return 'bg-emerald-500 ring-2 ring-emerald-200'
  if (bill.status === 'urgent') return 'bg-rose-500'
  if (bill.status === 'pending') return 'bg-amber-500'
  return 'bg-slate-300'
}

const getStatusTextColor = (bill: FixedBill) => {
  if (bill.is_paid) return 'text-emerald-600 font-semibold'
  if (bill.status === 'urgent') return 'text-rose-500 font-semibold'
  if (bill.status === 'pending') return 'text-amber-600 font-semibold'
  return 'text-slate-400 font-medium'
}
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm h-full flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base sm:text-lg font-bold tracking-tight text-slate-900">
        Próximas Contas
      </h3>
      <span class="text-xs font-semibold text-slate-400">
        Contas a Pagar
      </span>
    </div>

    <!-- Bills List -->
    <div class="divide-y divide-slate-100">
      <div
        v-for="bill in bills"
        :key="bill.id"
        class="py-3 sm:py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
      >
        <!-- Left: Status Dot & Title + Due text -->
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Status Dot -->
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-200',
              getDotColor(bill)
            ]"
          />

          <div class="truncate">
            <h4
              :class="[
                'text-sm font-bold text-slate-900 leading-tight truncate transition-colors',
                bill.is_paid ? 'line-through text-slate-400' : ''
              ]"
            >
              {{ bill.name }}
            </h4>
            <span :class="['text-xs block mt-0.5', getStatusTextColor(bill)]">
              {{ bill.status_text }}
            </span>
          </div>
        </div>

        <!-- Right: Amount & Quick Pay Action -->
        <div class="flex items-center gap-3 shrink-0">
          <span
            :class="[
              'text-sm font-bold text-slate-900',
              bill.is_paid ? 'text-slate-400' : ''
            ]"
          >
            {{ formatCurrency(bill.estimated_amount) }}
          </span>

          <button
            type="button"
            @click="emit('togglePaid', bill.id)"
            :title="bill.is_paid ? 'Marcar como não pago' : 'Marcar como pago'"
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
              bill.is_paid
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
            ]"
          >
            <Check v-if="bill.is_paid" class="w-4 h-4 stroke-[3]" />
            <span v-else class="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
