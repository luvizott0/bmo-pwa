<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatters'
import type { DashboardSummary } from '@/types/finance'

defineProps<{
  summary: DashboardSummary
}>()
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[26px] bg-[#0c1228] bg-gradient-to-br from-[#0c1228] via-[#0e1633] to-[#151c3d] p-7 text-white shadow-xl shadow-slate-900/10 border border-slate-800/80 transition-transform duration-200"
  >
    <!-- Background subtle radial glow -->
    <div class="pointer-events-none absolute -right-16 -top-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl" />
    <div class="pointer-events-none absolute -left-16 -bottom-16 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl" />

    <!-- Header / Title -->
    <div class="relative z-10">
      <span class="text-xs sm:text-sm font-medium text-slate-400 tracking-normal">
        Saldo Total ({{ summary.balance_period }})
      </span>

      <!-- Main Balance Number -->
      <h2 class="mt-2 text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white">
        {{ formatCurrency(summary.total_balance) }}
      </h2>

      <!-- Income & Expense metrics -->
      <div class="mt-7 grid grid-cols-2 gap-6 border-t border-slate-800/60 pt-5">
        <!-- Income -->
        <div>
          <span class="block text-[11px] font-bold tracking-wider uppercase text-slate-400">
            RECEITAS
          </span>
          <div class="mt-1 flex items-center gap-1.5 text-emerald-400 font-bold text-base sm:text-lg">
            <ArrowUpRight class="w-4 h-4 stroke-[2.5]" />
            <span>{{ formatCurrency(summary.monthly_income) }}</span>
          </div>
        </div>

        <!-- Expenses -->
        <div>
          <span class="block text-[11px] font-bold tracking-wider uppercase text-slate-400">
            DESPESAS
          </span>
          <div class="mt-1 flex items-center gap-1.5 text-rose-400 font-bold text-base sm:text-lg">
            <ArrowDownRight class="w-4 h-4 stroke-[2.5]" />
            <span>{{ formatCurrency(summary.monthly_expenses) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
