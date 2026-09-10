<script setup lang="ts">
import { useRouter } from 'vue-router'
import { formatCurrency } from '@/utils/formatters'
import type { Subscription } from '@/types/finance'

defineProps<{
  subscriptions: Subscription[]
}>()

const router = useRouter()
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm h-full flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base sm:text-lg font-bold tracking-tight text-slate-900">
        Assinaturas e Rateio
      </h3>
      <button
        type="button"
        @click="router.push('/subscriptions')"
        class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
      >
        Ver Todas
      </button>
    </div>

    <!-- Items List -->
    <div class="space-y-3">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-100/80 hover:bg-slate-50 transition-colors"
      >
        <!-- Left: Brand Icon & Name -->
        <div class="flex items-center gap-3.5">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-[11px] tracking-wider shrink-0 shadow-xs"
            :style="{ backgroundColor: sub.color_hex || sub.icon_bg || '#6366f1' }"
          >
            {{ sub.icon_type }}
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900 leading-tight">
              {{ sub.service_name }}
            </h4>
            <span class="text-xs text-slate-400 font-medium">
              {{ sub.due_text }}
            </span>
          </div>
        </div>

        <!-- Right: Members Avatar Stack + Price & Status -->
        <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 ml-13 sm:ml-0">
          <!-- Member Avatar Stack -->
          <div class="flex items-center -space-x-1.5 overflow-hidden">
            <div
              v-for="member in sub.members"
              :key="member.id"
              class="w-6 h-6 rounded-full ring-2 ring-emerald-500 bg-emerald-50 text-emerald-800 text-[10px] font-black flex items-center justify-center shadow-xs"
              :title="`${member.name}: ${member.is_paid ? 'Pago' : 'Pendente'}`"
            >
              {{ member.initials }}
            </div>
          </div>

          <!-- Price & Paid status -->
          <div class="text-right">
            <span class="block text-sm font-bold text-slate-900">
              {{ formatCurrency(sub.total_amount) }}
            </span>
            <span class="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              {{ sub.paid_count }}/{{ sub.total_members }} PAGOS
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
