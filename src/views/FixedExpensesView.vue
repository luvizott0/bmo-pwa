<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Droplets,
  Receipt,
  Tv,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import type { FixedBill, Subscription } from '@/types/finance'

import FixedBillCard from '@/components/fixed-expenses/FixedBillCard.vue'
import FixedBillModal from '@/components/fixed-expenses/FixedBillModal.vue'
import PayFixedBillModal from '@/components/fixed-expenses/PayFixedBillModal.vue'
import FixedBillHistoryModal from '@/components/fixed-expenses/FixedBillHistoryModal.vue'
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard.vue'
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal.vue'

const store = useDashboardStore()

onMounted(async () => {
  await store.fetchDashboardData()
})

// Tab navigation: 'all' | 'bills' | 'subscriptions'
const activeTab = ref<'all' | 'bills' | 'subscriptions'>('all')

// Modals state
const isBillModalOpen = ref(false)
const isSubModalOpen = ref(false)
const isPayModalOpen = ref(false)
const isHistoryModalOpen = ref(false)

const selectedBillForPay = ref<FixedBill | null>(null)
const selectedBillForHistory = ref<FixedBill | null>(null)
const selectedSubscriptionToEdit = ref<Subscription | null>(null)

// Computed metrics
const billsCount = computed(() => store.upcomingBills.length)
const subsCount = computed(() => store.familySubscriptions.length)
const totalCount = computed(() => billsCount.value + subsCount.value)

// Total expected amount for the month
const totalExpectedMonthly = computed(() => {
  const billsTotal = store.upcomingBills.reduce((acc, b) => acc + (b.estimated_amount || 0), 0)
  const subsTotal = store.familySubscriptions.reduce((acc, s) => acc + (s.total_amount || 0), 0)
  return billsTotal + subsTotal
})

// Total paid this month
const totalPaidThisMonth = computed(() => {
  const billsPaid = store.upcomingBills
    .filter(b => b.is_paid)
    .reduce((acc, b) => acc + (b.current_payment?.amount || b.estimated_amount || 0), 0)

  // For subscriptions: if family, sum member shares; if individual, count total_amount if is_paid
  const subsPaid = store.familySubscriptions
    .reduce((acc, s) => {
      if (s.is_family) {
        return acc + (s.total_members > 0 && s.paid_count === s.total_members ? s.total_amount : s.members.filter(m => m.is_paid).reduce((mAcc, m) => mAcc + m.installment_amount, 0))
      } else {
        return acc + (s.is_paid ? s.total_amount : 0)
      }
    }, 0)

  return billsPaid + subsPaid
})

// Total pending this month
const totalPendingThisMonth = computed(() => {
  const total = totalExpectedMonthly.value - totalPaidThisMonth.value
  return Math.max(0, total)
})

const paidCount = computed(() => {
  const paidBills = store.upcomingBills.filter(b => b.is_paid).length
  const paidSubs = store.familySubscriptions.filter(s => {
    if (s.is_family) {
      return s.total_members > 0 && s.paid_count === s.total_members
    }
    return !!s.is_paid
  }).length
  return paidBills + paidSubs
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
  const confirmed = window.confirm('Tem certeza que deseja excluir esta despesa fixa?')
  if (confirmed) {
    await store.deleteFixedBill(billId)
  }
}

// Handlers for Subscriptions
const handleToggleSubMember = async (subId: number, memberId: number) => {
  await store.toggleMemberPayment(subId, memberId)
}

const handleToggleSubscription = async (subId: number) => {
  await store.toggleSubscriptionPayment(subId)
}

const handleDeleteSub = async (subId: number) => {
  const confirmed = window.confirm('Tem certeza que deseja excluir esta assinatura?')
  if (confirmed) {
    await store.deleteSubscription(subId)
  }
}

const handleEditSub = (sub: Subscription) => {
  selectedSubscriptionToEdit.value = sub
  isSubModalOpen.value = true
}

const openCreateSub = () => {
  selectedSubscriptionToEdit.value = null
  isSubModalOpen.value = true
}

const handleRefresh = async () => {
  await store.fetchDashboardData()
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-24 lg:pb-12 max-w-[1400px]">
    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
            Despesas Fixas
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
          Contas essenciais (água, luz, internet, aluguel) e assinaturas com rateio
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="isBillModalOpen = true"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Conta Fixa</span>
        </button>

        <button
          type="button"
          @click="openCreateSub"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <Users class="w-4 h-4" />
          <span>+ Assinatura</span>
        </button>
      </div>
    </header>

    <!-- Overview Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
      <!-- Total Previsto -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Previsto no Mês
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {{ totalCount }} despesas
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-2">
          {{ formatCurrency(totalExpectedMonthly) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          {{ billsCount }} contas essenciais • {{ subsCount }} assinaturas
        </span>
      </div>

      <!-- Total Pago -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Já Pago no Mês
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            {{ paidCount }}/{{ totalCount }} pagas
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
            {{ totalCount - paidCount }} pendentes
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight block mt-2">
          {{ formatCurrency(totalPendingThisMonth) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Aguardando marcação de pagamento
        </span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto scrollbar-none">
      <button
        type="button"
        @click="activeTab = 'all'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0',
          activeTab === 'all'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
        ]"
      >
        Todas as Despesas ({{ totalCount }})
      </button>

      <button
        type="button"
        @click="activeTab = 'bills'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 inline-flex items-center gap-1.5',
          activeTab === 'bills'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
        ]"
      >
        <Droplets class="w-3.5 h-3.5" />
        <span>Contas Essenciais ({{ billsCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'subscriptions'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 inline-flex items-center gap-1.5',
          activeTab === 'subscriptions'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
        ]"
      >
        <Users class="w-3.5 h-3.5" />
        <span>Assinaturas & Rateios ({{ subsCount }})</span>
      </button>
    </div>

    <!-- Section 1: Contas Essenciais (Água, Luz, Internet, Aluguel, etc.) -->
    <section v-if="activeTab === 'all' || activeTab === 'bills'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900 leading-tight">
            Contas Essenciais & Moradia
          </h2>
          <p class="text-xs text-slate-400 font-medium">
            Aluguel, água, energia, internet e contas de valor variável
          </p>
        </div>

        <button
          type="button"
          @click="isBillModalOpen = true"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer hidden sm:inline-flex items-center gap-1"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Adicionar Conta</span>
        </button>
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
              Água, luz, internet, aluguel ou condomínio
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Section 2: Assinaturas e Rateios (Streaming, Serviços, etc.) -->
    <section v-if="activeTab === 'all' || activeTab === 'subscriptions'" class="space-y-4 pt-2">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900 leading-tight">
            Assinaturas & Rateios Familiares
          </h2>
          <p class="text-xs text-slate-400 font-medium">
            Streaming e planos divididos com amigos e família
          </p>
        </div>

        <button
          type="button"
          @click="openCreateSub"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer hidden sm:inline-flex items-center gap-1"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Adicionar Assinatura</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <SubscriptionCard
          v-for="sub in store.familySubscriptions"
          :key="sub.id"
          :subscription="sub"
          @toggle-member="handleToggleSubMember"
          @toggle-subscription="handleToggleSubscription"
          @edit="handleEditSub"
          @delete="handleDeleteSub"
        />

        <!-- Dashed Add Card -->
        <button
          type="button"
          @click="openCreateSub"
          class="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-[26px] p-8 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all duration-200 cursor-pointer group text-center"
        >
          <div class="w-12 h-12 rounded-full border border-slate-200 group-hover:border-indigo-400 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition shadow-2xs">
            <Plus class="w-6 h-6" />
          </div>
          <div>
            <span class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 block">
               Nova Assinatura
            </span>
            <span class="text-xs text-slate-400 font-medium mt-0.5 block">
              Individual ou rateio em família
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Modals -->
    <!-- Create Fixed Bill Modal -->
    <FixedBillModal
      :is-open="isBillModalOpen"
      @close="isBillModalOpen = false"
      @created="handleRefresh"
    />

    <!-- Pay Fixed Bill Modal -->
    <PayFixedBillModal
      :is-open="isPayModalOpen"
      :bill="selectedBillForPay"
      @close="isPayModalOpen = false"
      @paid="handleRefresh"
    />

    <!-- Fixed Bill History Modal -->
    <FixedBillHistoryModal
      :is-open="isHistoryModalOpen"
      :bill="selectedBillForHistory"
      @close="isHistoryModalOpen = false"
    />

    <!-- Create / Edit Subscription Modal -->
    <SubscriptionModal
      :is-open="isSubModalOpen"
      :subscription-to-edit="selectedSubscriptionToEdit"
      @close="isSubModalOpen = false; selectedSubscriptionToEdit = null"
      @created="handleRefresh"
      @updated="handleRefresh"
    />
  </div>
</template>
