<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Search,
  X,
  RefreshCw,
  Plus,
  CreditCard as CreditCardIcon,
  Building2,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency, formatFullDate } from '@/utils/formatters'
import type { TransactionItem } from '@/types/finance'
import TransactionModal from '@/components/dashboard/TransactionModal.vue'

const router = useRouter()
const store = useDashboardStore()

const transactions = ref<TransactionItem[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const lastPage = ref(1)
const totalCount = ref(0)
const summary = ref({
  total_income: 0,
  total_expenses: 0,
  period_balance: 0,
})

const activeFilter = ref<'all' | 'income' | 'expense' | 'installments'>('all')
const searchQuery = ref('')
const selectedAccount = ref<string>('all')

const isTransactionModalOpen = ref(false)
const transactionModalType = ref<'income' | 'expense'>('expense')

const loadTransactions = async (page = 1) => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      page,
      per_page: 20,
    }

    if (activeFilter.value === 'income') params.type = 'income'
    if (activeFilter.value === 'expense') params.type = 'expense'
    if (activeFilter.value === 'installments') params.installments_only = true

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (selectedAccount.value !== 'all') {
      if (selectedAccount.value.startsWith('card_')) {
        params.credit_card_id = selectedAccount.value.replace('card_', '')
      } else if (selectedAccount.value.startsWith('bank_')) {
        params.bank_account_id = selectedAccount.value.replace('bank_', '')
      }
    }

    const res = await store.fetchFullTransactions(params)
    if (res?.data && Array.isArray(res.data)) {
      transactions.value = res.data
      if (res.meta) {
        currentPage.value = res.meta.current_page || page
        lastPage.value = res.meta.last_page || 1
        totalCount.value = res.meta.total !== undefined ? res.meta.total : res.data.length
        if (res.meta.summary) {
          summary.value = {
            total_income: Number(res.meta.summary.total_income || 0),
            total_expenses: Number(res.meta.summary.total_expenses || 0),
            period_balance: Number(res.meta.summary.period_balance || 0),
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao buscar extrato de transações', error)
  } finally {
    isLoading.value = false
  }
}

let searchDebounceTimeout: any = null
watch(searchQuery, () => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    loadTransactions(1)
  }, 350)
})

watch([activeFilter, selectedAccount], () => {
  loadTransactions(1)
})

onMounted(async () => {
  if (store.bankAccounts.length === 0 && store.creditCards.length === 0) {
    await store.fetchDashboardData()
  }
  await loadTransactions(1)
})

const handleTransactionCreated = async () => {
  isTransactionModalOpen.value = false
  await store.fetchDashboardData()
  await loadTransactions(1)
}

const clearFilters = () => {
  searchQuery.value = ''
  activeFilter.value = 'all'
  selectedAccount.value = 'all'
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= lastPage.value && page !== currentPage.value) {
    loadTransactions(page)
  }
}

const openAddIncome = () => {
  transactionModalType.value = 'income'
  isTransactionModalOpen.value = true
}

const openAddExpense = () => {
  transactionModalType.value = 'expense'
  isTransactionModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-24 lg:pb-12 max-w-[1400px]">
    <!-- Top Navigation & Header -->
    <header class="space-y-4">
      <!-- Back Button -->
      <div>
        <button
          type="button"
          @click="router.push('/')"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft class="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para o Início</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
              Extrato & Histórico
            </h1>
            <button
              type="button"
              @click="loadTransactions(currentPage)"
              :title="isLoading ? 'Atualizando...' : 'Recarregar dados'"
              class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <RefreshCw :class="['w-4 h-4', isLoading ? 'animate-spin text-indigo-600' : '']" />
            </button>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Total de {{ totalCount }} movimentações registradas
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="openAddIncome"
            class="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer text-center"
          >
            Adicionar Receita
          </button>
          <button
            type="button"
            @click="openAddExpense"
            class="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer text-center"
          >
            Adicionar Despesa
          </button>
        </div>
      </div>
    </header>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Income -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Receitas
          </span>
          <span class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {{ formatCurrency(summary.total_income) }}
          </span>
        </div>
      </div>

      <!-- Total Expense -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <TrendingDown class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Despesas
          </span>
          <span class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {{ formatCurrency(summary.total_expenses) }}
          </span>
        </div>
      </div>

      <!-- Period Balance -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center gap-4">
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
            summary.period_balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
          ]"
        >
          <Wallet class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Saldo do Período
          </span>
          <span
            :class="[
              'text-xl sm:text-2xl font-black leading-tight',
              summary.period_balance >= 0 ? 'text-indigo-600' : 'text-rose-600'
            ]"
          >
            {{ formatCurrency(summary.period_balance) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-2xs space-y-4">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por descrição, observações..."
            class="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Account / Card Selector -->
        <div class="w-full lg:w-72">
          <select
            v-model="selectedAccount"
            class="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="all">Todas as Contas & Cartões</option>
            <optgroup v-if="store.bankAccounts.length > 0" label="Contas Bancárias">
              <option
                v-for="acc in store.bankAccounts"
                :key="acc.id"
                :value="`bank_${acc.id}`"
              >
                🏦 {{ acc.name }}
              </option>
            </optgroup>
            <optgroup v-if="store.creditCards.length > 0" label="Cartões de Crédito">
              <option
                v-for="card in store.creditCards"
                :key="card.id"
                :value="`card_${card.id}`"
              >
                💳 {{ card.name }} ({{ card.brand }})
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          @click="activeFilter = 'all'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          Todas
        </button>

        <button
          type="button"
          @click="activeFilter = 'income'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
            activeFilter === 'income'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          ]"
        >
          <ArrowDownLeft class="w-3.5 h-3.5" />
          <span>Receitas</span>
        </button>

        <button
          type="button"
          @click="activeFilter = 'expense'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
            activeFilter === 'expense'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          ]"
        >
          <ArrowUpRight class="w-3.5 h-3.5" />
          <span>Despesas</span>
        </button>

        <button
          type="button"
          @click="activeFilter = 'installments'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
            activeFilter === 'installments'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          ]"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Parceladas</span>
        </button>

        <!-- Clear filters button if any active -->
        <button
          v-if="searchQuery || activeFilter !== 'all' || selectedAccount !== 'all'"
          type="button"
          @click="clearFilters"
          class="ml-auto text-xs font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
        >
          Limpar filtros
        </button>
      </div>
    </div>

    <!-- Transactions List Container -->
    <div class="bg-white rounded-[26px] p-5 sm:p-7 border border-slate-100 shadow-sm">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center">
        <RefreshCw class="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p class="text-sm font-bold text-slate-600">Carregando transações...</p>
      </div>

      <!-- Transactions List -->
      <div v-else-if="transactions.length > 0" class="divide-y divide-slate-100">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-2xl px-3 -mx-3 transition-colors group"
        >
          <!-- Left: Icon & Details -->
          <div class="flex items-center gap-4 min-w-0">
            <!-- Icon -->
            <div
              :class="[
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs',
                tx.installment_number || tx.installment_group_id
                  ? 'bg-purple-50 text-purple-600'
                  : tx.type === 'income'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              ]"
            >
              <Layers v-if="tx.installment_number || tx.installment_group_id" class="w-5 h-5" />
              <ArrowDownLeft v-else-if="tx.type === 'income'" class="w-5 h-5" />
              <ArrowUpRight v-else class="w-5 h-5" />
            </div>

            <!-- Description, Badges and Account -->
            <div class="truncate">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {{ tx.description || (tx.type === 'income' ? 'Receita' : 'Despesa') }}
                </h3>

                <!-- Installment badge -->
                <span
                  v-if="tx.installment_number && tx.total_installments"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60"
                >
                  <Layers class="w-3 h-3" />
                  <span>Parcela {{ tx.installment_number }}/{{ tx.total_installments }}</span>
                </span>

                <!-- Category pill -->
                <span
                  v-if="tx.category"
                  class="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600"
                >
                  {{ tx.category.name }}
                </span>
              </div>

              <!-- Metadata row -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
                <span>{{ formatFullDate(tx.occurred_at) }}</span>

                <!-- Bank Account / Card -->
                <span v-if="tx.credit_card" class="inline-flex items-center gap-1 text-slate-600 font-semibold">
                  <span>•</span>
                  <CreditCardIcon class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ tx.credit_card.name }}</span>
                  <span v-if="tx.credit_card.brand" class="text-slate-400 text-[11px]">({{ tx.credit_card.brand }})</span>
                </span>
                <span v-else-if="tx.bank_account" class="inline-flex items-center gap-1 text-slate-600 font-semibold">
                  <span>•</span>
                  <Building2 class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ tx.bank_account.name }}</span>
                </span>

                <!-- Notes if any -->
                <span v-if="tx.notes" class="text-slate-400 italic max-w-xs truncate">
                  • {{ tx.notes }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right: Amount & Status -->
          <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pl-15 sm:pl-0">
            <span
              :class="[
                'text-base sm:text-lg font-black tracking-tight',
                tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
              ]"
            >
              {{ tx.type === 'income' ? '+' : '-' }} {{ formatCurrency(tx.amount) }}
            </span>

            <span
              :class="[
                'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                tx.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              ]"
            >
              {{ tx.status === 'paid' ? 'Efetivado' : 'Pendente' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
      >
        <ReceiptText class="w-12 h-12 text-slate-300 mb-3" />
        <h3 class="text-base font-bold text-slate-700">Nenhuma transação encontrada</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          Não encontramos lançamentos com os filtros selecionados. Tente alterar a busca ou adicionar novas transações.
        </p>
        <button
          v-if="searchQuery || activeFilter !== 'all' || selectedAccount !== 'all'"
          type="button"
          @click="clearFilters"
          class="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
        >
          Limpar Filtros
        </button>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="lastPage > 1"
        class="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium"
      >
        <span>
          Página <strong class="text-slate-800">{{ currentPage }}</strong> de <strong class="text-slate-800">{{ lastPage }}</strong> ({{ totalCount }} no total)
        </span>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1 || isLoading"
            class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <span class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
            {{ currentPage }}
          </span>

          <button
            type="button"
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= lastPage || isLoading"
            class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Modal for creating new entries -->
    <TransactionModal
      :is-open="isTransactionModalOpen"
      :initial-type="transactionModalType"
      @close="isTransactionModalOpen = false"
      @transaction-created="handleTransactionCreated"
    />
  </div>
</template>
