<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Tv,
  Users,
  History,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import type { Subscription } from '@/types/finance'

import SubscriptionCard from '@/components/subscriptions/SubscriptionCard.vue'
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal.vue'
import SubscriptionHistoryModal from '@/components/subscriptions/SubscriptionHistoryModal.vue'
import FriendsModal from '@/components/subscriptions/FriendsModal.vue'

const store = useDashboardStore()

onMounted(async () => {
  await store.fetchDashboardData()
})

// Tab navigation: 'all' | 'family' | 'individual'
const activeTab = ref<'all' | 'family' | 'individual'>('all')

// Modals state
const isSubModalOpen = ref(false)
const isHistoryModalOpen = ref(false)
const isFriendsModalOpen = ref(false)

const selectedSubscriptionToEdit = ref<Subscription | null>(null)
const selectedSubscriptionForHistory = ref<number | null>(null)

// Computed metrics
const subsCount = computed(() => store.familySubscriptions.length)
const familySubsCount = computed(() => store.familySubscriptions.filter(s => s.is_family).length)
const individualSubsCount = computed(() => store.familySubscriptions.filter(s => !s.is_family).length)

// Total expected amount for the month
const totalExpectedMonthly = computed(() => {
  return store.familySubscriptions.reduce((acc, s) => acc + (s.total_amount || 0), 0)
})

// Total paid this month
const totalPaidThisMonth = computed(() => {
  return store.familySubscriptions.reduce((acc, s) => {
    if (s.is_family) {
      return acc + (s.total_members > 0 && s.paid_count === s.total_members ? s.total_amount : s.members.filter(m => m.is_paid).reduce((mAcc, m) => mAcc + m.installment_amount, 0))
    } else {
      return acc + (s.is_paid ? s.total_amount : 0)
    }
  }, 0)
})

// Total pending this month
const totalPendingThisMonth = computed(() => {
  const total = totalExpectedMonthly.value - totalPaidThisMonth.value
  return Math.max(0, total)
})

const paidCount = computed(() => {
  return store.familySubscriptions.filter(s => {
    if (s.is_family) {
      return s.total_members > 0 && s.paid_count === s.total_members
    }
    return !!s.is_paid
  }).length
})

// Filtered list
const filteredSubscriptions = computed(() => {
  if (activeTab.value === 'family') {
    return store.familySubscriptions.filter(s => s.is_family)
  }
  if (activeTab.value === 'individual') {
    return store.familySubscriptions.filter(s => !s.is_family)
  }
  return store.familySubscriptions
})

// Handlers
const openCreateSub = () => {
  selectedSubscriptionToEdit.value = null
  isSubModalOpen.value = true
}

const handleEditSub = (sub: Subscription) => {
  selectedSubscriptionToEdit.value = sub
  isSubModalOpen.value = true
}

const handleViewHistory = (sub?: Subscription) => {
  selectedSubscriptionForHistory.value = sub?.id || null
  isHistoryModalOpen.value = true
}

const openFriendsModal = () => {
  isFriendsModalOpen.value = true
}

const handleDeleteSub = async (subId: number) => {
  const confirmed = window.confirm('Tem certeza que deseja excluir esta assinatura?')
  if (confirmed) {
    await store.deleteSubscription(subId)
  }
}

const handleToggleSubMember = async (subId: number, memberId: number) => {
  await store.toggleMemberPayment(subId, memberId)
}

const handleToggleSubscription = async (subId: number) => {
  await store.toggleSubscriptionPayment(subId)
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
            Assinaturas
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
          Streaming, serviços recorrentes e divisões de despesas com amigos
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Histórico de Pagamentos -->
        <button
          type="button"
          @click="handleViewHistory()"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
        >
          <History class="w-4 h-4 text-indigo-600" />
          <span>Histórico</span>
        </button>

        <!-- Meus Amigos -->
        <button
          type="button"
          @click="openFriendsModal"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-bold transition cursor-pointer"
        >
          <Users class="w-4 h-4 text-slate-600" />
          <span>Amigos</span>
          <span
            v-if="store.friends.length > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white"
          >
            {{ store.friends.length }}
          </span>
        </button>

        <!-- Nova Assinatura -->
        <button
          type="button"
          @click="openCreateSub"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Nova Assinatura</span>
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
            {{ subsCount }} assinaturas
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-2">
          {{ formatCurrency(totalExpectedMonthly) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          {{ familySubsCount }} compartilhadas • {{ individualSubsCount }} individuais
        </span>
      </div>

      <!-- Total Pago -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Já Pago no Mês
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            {{ paidCount }}/{{ subsCount }} quitadas
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight block mt-2">
          {{ formatCurrency(totalPaidThisMonth) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Quitadas ou recebidas dos amigos
        </span>
      </div>

      <!-- Pendente -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Pendente no Mês
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
            {{ subsCount - paidCount }} pendentes
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight block mt-2">
          {{ formatCurrency(totalPendingThisMonth) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Aguardando liquidação ou Pix
        </span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto scrollbar-none">
      <button
        type="button"
        @click="activeTab = 'all'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer',
          activeTab === 'all'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        ]"
      >
        Todas ({{ subsCount }})
      </button>

      <button
        type="button"
        @click="activeTab = 'family'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
          activeTab === 'family'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        ]"
      >
        <Users class="w-3.5 h-3.5" />
        <span>Com Amigos / Rateio ({{ familySubsCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'individual'"
        :class="[
          'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
          activeTab === 'individual'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        ]"
      >
        <Tv class="w-3.5 h-3.5" />
        <span>Individuais ({{ individualSubsCount }})</span>
      </button>
    </div>

    <!-- Subscriptions Grid -->
    <div v-if="filteredSubscriptions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      <SubscriptionCard
        v-for="sub in filteredSubscriptions"
        :key="sub.id"
        :subscription="sub"
        @toggle-member="handleToggleSubMember"
        @toggle-subscription="handleToggleSubscription"
        @delete="handleDeleteSub"
        @edit="handleEditSub"
        @view-history="handleViewHistory"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white"
    >
      <Tv class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-bold text-slate-800">
        Nenhuma assinatura encontrada
      </h3>
      <p class="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
        {{ activeTab === 'all'
          ? 'Cadastre suas assinaturas de streaming e serviços para controlar seus gastos e rateios com amigos.'
          : 'Nenhuma assinatura cadastrada para o filtro selecionado.' }}
      </p>
      <button
        type="button"
        @click="openCreateSub"
        class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Cadastrar Primeira Assinatura</span>
      </button>
    </div>

    <!-- Modals -->
    <SubscriptionModal
      :is-open="isSubModalOpen"
      :subscription-to-edit="selectedSubscriptionToEdit"
      @close="isSubModalOpen = false"
      @created="handleRefresh"
      @updated="handleRefresh"
    />

    <SubscriptionHistoryModal
      :is-open="isHistoryModalOpen"
      :subscription-id="selectedSubscriptionForHistory"
      @close="isHistoryModalOpen = false"
    />

    <FriendsModal
      :is-open="isFriendsModalOpen"
      @close="isFriendsModalOpen = false"
    />
  </div>
</template>
