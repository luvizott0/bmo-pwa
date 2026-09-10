<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw, UserCheck } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import TotalBalanceCard from '@/components/dashboard/TotalBalanceCard.vue'
import QuarterlyPerformanceChart from '@/components/dashboard/QuarterlyPerformanceChart.vue'
import FamilySubscriptionsCard from '@/components/dashboard/FamilySubscriptionsCard.vue'
import UpcomingBillsCard from '@/components/dashboard/UpcomingBillsCard.vue'
import BankAccountsSection from '@/components/dashboard/BankAccountsSection.vue'
import RecentTransactionsCard from '@/components/dashboard/RecentTransactionsCard.vue'
import TransactionModal from '@/components/dashboard/TransactionModal.vue'
import AccountModal from '@/components/dashboard/AccountModal.vue'
import AuthModal from '@/components/auth/AuthModal.vue'

const store = useDashboardStore()
const authStore = useAuthStore()

const isTransactionModalOpen = ref(false)
const transactionModalType = ref<'income' | 'expense'>('expense')
const isAccountModalOpen = ref(false)
const isAuthModalOpen = ref(false)

onMounted(async () => {
  await store.fetchDashboardData()
})

const openAddIncome = () => {
  transactionModalType.value = 'income'
  isTransactionModalOpen.value = true
}

const openAddExpense = () => {
  transactionModalType.value = 'expense'
  isTransactionModalOpen.value = true
}

const handleTogglePaid = (billId: number) => {
  store.toggleBillPaid(billId)
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-20 lg:pb-10">
    <!-- Top Header: Title, Greeting & Action Buttons -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
            Visão Geral
          </h1>

          <!-- Live API Indicator / Refresh Button -->
          <button
            type="button"
            @click="store.fetchDashboardData"
            :title="store.isFetching ? 'Atualizando dados...' : 'Atualizar com a API'"
            class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw :class="['w-4 h-4', store.isFetching ? 'animate-spin text-indigo-600' : '']" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-slate-500 font-medium italic mt-1 flex items-center gap-2">
          <span>Olá, {{ store.summary.user_name }}. {{ store.summary.greeting_subtitle }}</span>
          <button
            type="button"
            @click="isAuthModalOpen = true"
            class="not-italic text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer ml-1"
          >
            (Trocar Conta)
          </button>
        </p>
      </div>

      <!-- Action Buttons (Add Income / Add Expense) -->
      <div class="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
        <button
          type="button"
          @click="openAddIncome"
          class="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer text-center"
        >
          Adicionar Receita
        </button>
        <button
          type="button"
          @click="openAddExpense"
          class="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all duration-150 cursor-pointer text-center"
        >
          Adicionar Despesa
        </button>
      </div>
    </header>

    <!-- Row 1: Total Balance Card & Quarterly Performance Chart -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      <!-- Balance Card -->
      <div class="lg:col-span-5 h-full">
        <TotalBalanceCard :summary="store.summary" class="h-full" />
      </div>

      <!-- Quarterly Chart -->
      <div class="lg:col-span-7 h-full">
        <QuarterlyPerformanceChart :data="store.quarterlyData" class="h-full" />
      </div>
    </section>

    <!-- Row 2: Family Subscriptions & Upcoming Bills -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      <!-- Family Subscriptions -->
      <div class="lg:col-span-7 h-full">
        <FamilySubscriptionsCard :subscriptions="store.familySubscriptions" class="h-full" />
      </div>

      <!-- Upcoming Bills & Reminders -->
      <div class="lg:col-span-5 h-full">
        <UpcomingBillsCard
          :bills="store.upcomingBills"
          @toggle-paid="handleTogglePaid"
          class="h-full"
        />
      </div>
    </section>

    <!-- Row 3: Recent Transactions (Extrato / Histórico) -->
    <section>
      <RecentTransactionsCard :transactions="store.recentTransactions" />
    </section>

    <!-- Row 4: Bank Accounts & Cards -->
    <section>
      <BankAccountsSection
        :accounts="store.bankAccounts"
        :cards="store.creditCards"
        @add-account="isAccountModalOpen = true"
      />
    </section>

    <!-- Modals -->
    <TransactionModal
      :is-open="isTransactionModalOpen"
      :initial-type="transactionModalType"
      @close="isTransactionModalOpen = false"
    />

    <AccountModal
      :is-open="isAccountModalOpen"
      @close="isAccountModalOpen = false"
    />

    <AuthModal
      :is-open="isAuthModalOpen"
      @close="isAuthModalOpen = false"
    />
  </div>
</template>
