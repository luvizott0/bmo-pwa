<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/utils/formatters'
import type { QuarterlyMonth } from '@/types/finance'

const props = defineProps<{
  data: QuarterlyMonth[]
}>()

const maxChartValue = computed(() => {
  const max = Math.max(...props.data.flatMap(d => [d.income, d.expenses]), 1000)
  return Math.ceil(max / 1000) * 1000
})

const getBarHeight = (value: number) => {
  const percentage = (value / maxChartValue.value) * 100
  return Math.max(percentage, 4) // minimum 4% so it's always visible
}
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
    <!-- Header with Title & Legend -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div>
        <h3 class="text-base sm:text-lg font-bold tracking-tight text-slate-900">
          Desempenho Trimestral
        </h3>
        <p class="text-xs text-slate-400 font-normal mt-0.5">
          Receitas vs Despesas — últimos 3 meses
        </p>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs font-medium text-slate-600 shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>Receitas</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span>Despesas</span>
        </div>
      </div>
    </div>

    <!-- Chart Visualization -->
    <div class="mt-6 relative pt-4 pb-2">
      <!-- Dotted Background Grid Lines -->
      <div class="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 pointer-events-none" />
      <div class="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 pointer-events-none" />
      <div class="absolute inset-x-0 bottom-8 border-b border-dashed border-slate-100 pointer-events-none" />

      <!-- Bars Container -->
      <div class="relative z-10 flex items-end justify-around h-44 sm:h-48 px-2 sm:px-6">
        <div
          v-for="item in data"
          :key="item.month"
          class="flex flex-col items-center group cursor-pointer"
        >
          <!-- Bars Pair -->
          <div class="flex items-end gap-1.5 sm:gap-2 h-36 relative">
            <!-- Income Bar -->
            <div class="relative flex flex-col items-center">
              <div
                class="w-5 sm:w-7 rounded-t-lg bg-indigo-600 group-hover:bg-indigo-700 transition-all duration-300"
                :style="{ height: `${getBarHeight(item.income)}%` }"
              />
              <!-- Tooltip on hover -->
              <div
                class="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity duration-150 z-20"
              >
                {{ formatCurrency(item.income) }}
              </div>
            </div>

            <!-- Expenses Bar -->
            <div class="relative flex flex-col items-center">
              <div
                class="w-5 sm:w-7 rounded-t-lg bg-slate-200 group-hover:bg-slate-300 transition-all duration-300"
                :style="{ height: `${getBarHeight(item.expenses)}%` }"
              />
              <!-- Tooltip on hover -->
              <div
                class="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity duration-150 z-20"
              >
                {{ formatCurrency(item.expenses) }}
              </div>
            </div>
          </div>

          <!-- Month Label -->
          <span class="mt-3 text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">
            {{ item.month }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
