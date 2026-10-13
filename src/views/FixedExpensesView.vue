<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Droplets,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  MailSearch,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import type { FixedBill } from '@/types/finance'

import FixedBillCard from '@/components/fixed-expenses/FixedBillCard.vue'
import FixedBillModal from '@/components/fixed-expenses/FixedBillModal.vue'
import PayFixedBillModal from '@/components/fixed-expenses/PayFixedBillModal.vue'
import FixedBillHistoryModal from '@/components/fixed-expenses/FixedBillHistoryModal.vue'

const store = useDashboardStore()

onMounted(async () => {
  await store.fetchDashboardData()
})

// Modals state
const isBillModalOpen = ref(false)
const isPayModalOpen = ref(false)
const isHistoryModalOpen = ref(false)
const isSyncingEmails = ref(false)
const syncFeedback = ref<string | null>(null)

const selectedBillForPay = ref<FixedBill | null>(null)
const selectedBillForHistory = ref<FixedBill | null>(null)

// Computed metrics for House Bills only
const billsCount = computed(() => store.upcomingBills.length)

// Total expected amount for the month (uses synced invoice amount if available)
const totalExpectedMonthly = computed(() => {
  return store.upcomingBills.reduce(
    (acc, b) => acc + (b.current_month_amount || b.current_invoice?.amount || b.estimated_amount || 0),
    0
  )
})

// Total paid this month
const totalPaidThisMonth = computed(() => {
  return store.upcomingBills
    .filter(b => b.is_paid)
    .reduce((acc, b) => acc + (b.current_payment?.amount || b.current_month_amount || b.estimated_amount || 0), 0)
})

// Total pending this month
const totalPendingThisMonth = computed(() => {
  const total = totalExpectedMonthly.value - totalPaidThisMonth.value
  return Math.max(0, total)
})

const paidCount = computed(() => {
  return store.upcomingBills.filter(b => b.is_paid).length
})

// Handlers for Fixed Bills
const handlePayBill = (bill: FixedBill) => {
  selectedBillForPay.value = bill
  isPayModalOpen.value = true
}

const handleUnpayBill = async (billId: number) => {
  await store.unpayFixedBill(billId)
}

const handleViewHistory = (bill: FixedBill) => {
  selectedBillForHistory.value = bill
  isHistoryModalOpen.value = true
}

const handleDeleteBill = async (billId: number) => {
  const confirmed = window.confirm('Tem certeza que deseja excluir esta conta?')
  if (confirmed) {
    await store.deleteFixedBill(billId)
  }
}

const handleRefresh = async () => {
  await store.fetchDashboardData()
}

const handleSyncEmails = async () => {
  if (isSyncingEmails.value) return
  isSyncingEmails.value = true
  syncFeedback.value = null
  try {
    const res = await store.syncFixedBillsEmails()
    syncFeedback.value = res?.message || 'E-mails verificados com sucesso!'
    setTimeout(() => {
      syncFeedback.value = null
    }, 4500)
  } catch (err: any) {
    syncFeedback.value = err?.message || 'Não foi possível sincronizar os e-mails no momento.'
    setTimeout(() => {
      syncFeedback.value = null
    }, 5000)
  } finally {
    isSyncingEmails.value = false
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-24 lg:pb-12 max-w-[1400px]">
    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
            Contas da Casa
          </h1>
          <button
            type="button"
            @click="handleRefresh"
            :title="store.isFetching ? 'Atualizando...' : 'Atualizar com a API'"
            class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw :class="['w-4 h-4', store.isFetching ? 'animate-spin text-indigo-600' : '']" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Contas essenciais da residência (água, energia, internet, aluguel e condomínio)
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          :disabled="isSyncingEmails"
          @click="handleSyncEmails"
          class="inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer disabled:opacity-60"
          title="Verificar novas faturas de Luz (CPFL) e Internet (Alares) no e-mail"
        >
          <MailSearch :class="['w-4 h-4 text-indigo-600', isSyncingEmails ? 'animate-bounce' : '']" />
          <span>{{ isSyncingEmails ? 'Buscando Faturas...' : 'Checar E-mails' }}</span>
        </button>

        <button
          type="button"
          @click="isBillModalOpen = true"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Nova Conta</span>
        </button>
      </div>
    </header>

    <div
      v-if="syncFeedback"
      class="px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs sm:text-sm font-semibold flex items-center justify-between"
    >
      <span>{{ syncFeedback }}</span>
    </div>

    <!-- Overview Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
      <!-- Total Previsto -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Previsto no Mês
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {{ billsCount }} contas
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-2">
          {{ formatCurrency(totalExpectedMonthly) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Previsão mensal de moradia
        </span>
      </div>

      <!-- Total Pago -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Já Pago no Mês
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            {{ paidCount }}/{{ billsCount }} pagas
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight block mt-2">
          {{ formatCurrency(totalPaidThisMonth) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Liquidado e debitado das contas
        </span>
      </div>

      <!-- Pendente -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Pendente a Vencer
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
            {{ billsCount - paidCount }} pendentes
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight block mt-2">
          {{ formatCurrency(totalPendingThisMonth) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Aguardando vencimento ou quitação
        </span>
      </div>
    </div>

    <!-- Bills Grid -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-900 leading-tight">
          Lista de Contas
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <FixedBillCard
          v-for="bill in store.upcomingBills"
          :key="bill.id"
          :bill="bill"
          @pay="handlePayBill"
          @unpay="handleUnpayBill"
          @view-history="handleViewHistory"
          @delete="handleDeleteBill"
        />

        <!-- Dashed Add Card -->
        <button
          type="button"
          @click="isBillModalOpen = true"
          class="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-[26px] p-8 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all duration-200 cursor-pointer group text-center"
        >
          <div class="w-12 h-12 rounded-full border border-slate-200 group-hover:border-indigo-400 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition shadow-2xs">
            <Plus class="w-6 h-6" />
          </div>
          <div>
            <span class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 block">
              Nova Conta Essencial
            </span>
            <span class="text-xs text-slate-400 font-medium mt-0.5 block">
              Água, energia, internet, aluguel ou condomínio
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Modals -->
    <FixedBillModal
      :is-open="isBillModalOpen"
      @close="isBillModalOpen = false"
      @created="handleRefresh"
    />

    <PayFixedBillModal
      :is-open="isPayModalOpen"
      :bill="selectedBillForPay"
      @close="isPayModalOpen = false"
      @paid="handleRefresh"
    />

    <FixedBillHistoryModal
      :is-open="isHistoryModalOpen"
      :bill="selectedBillForHistory"
      @close="isHistoryModalOpen = false"
    />
  </div>
</template>
