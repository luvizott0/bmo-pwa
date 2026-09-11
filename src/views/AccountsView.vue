<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Landmark, CreditCard, RefreshCw, Calendar, TrendingUp, Pencil } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/formatters'
import type { CreditCard as ICreditCard, BankAccount as IBankAccount } from '@/types/finance'
import BankAccountModal from '@/components/dashboard/BankAccountModal.vue'
import CardModal from '@/components/dashboard/CardModal.vue'
import MonthlyLimitsModal from '@/components/dashboard/MonthlyLimitsModal.vue'

const store = useDashboardStore()
const authStore = useAuthStore()

const isBankAccountModalOpen = ref(false)
const selectedAccountToEdit = ref<IBankAccount | null>(null)

const isCardModalOpen = ref(false)
const selectedCardToEdit = ref<ICreditCard | null>(null)

const isLimitsModalOpen = ref(false)
const selectedCardForLimits = ref<ICreditCard | null>(null)

onMounted(async () => {
  await store.fetchDashboardData()
})

const openCreateAccount = () => {
  selectedAccountToEdit.value = null
  isBankAccountModalOpen.value = true
}

const openEditAccount = (acc: IBankAccount) => {
  selectedAccountToEdit.value = acc
  isBankAccountModalOpen.value = true
}

const openCreateCard = () => {
  selectedCardToEdit.value = null
  isCardModalOpen.value = true
}

const openEditCard = (card: ICreditCard) => {
  selectedCardToEdit.value = card
  isCardModalOpen.value = true
}

const openCardLimits = (card: ICreditCard) => {
  selectedCardForLimits.value = card
  isLimitsModalOpen.value = true
}

const getStatementDueDateText = (dueDay: number) => {
  const today = new Date().getDate()
  const diffDays = dueDay - today
  if (diffDays === 0) return 'Hoje'
  if (diffDays > 0) return `em ${diffDays}d`
  return `Atrasado • ${Math.abs(diffDays)}d`
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-24 lg:pb-12 max-w-[1400px]">
    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
            Contas & Cartões
          </h1>
          <button
            type="button"
            @click="store.fetchDashboardData"
            :title="store.isFetching ? 'Atualizando contas...' : 'Atualizar da API'"
            class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw :class="['w-4 h-4', store.isFetching ? 'animate-spin text-indigo-600' : '']" />
          </button>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {{ store.totalAccountsCount }} contas • {{ formatCurrency(store.summary.total_balance) }} no total de saldos
        </p>
      </div>

      <!-- 2 Distinct Action Buttons -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <!-- Button 1: Adicionar Conta Bancária -->
        <button
          type="button"
          @click="openCreateAccount"
          class="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer text-center"
        >
          <Landmark class="w-4 h-4 text-blue-600 stroke-[2.2]" />
          <span>+ Nova Conta Bancária</span>
        </button>

        <!-- Button 2: Adicionar Cartão -->
        <button
          type="button"
          @click="openCreateCard"
          class="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-center"
        >
          <CreditCard class="w-4 h-4 stroke-[2.2]" />
          <span>+ Novo Cartão</span>
        </button>
      </div>
    </header>

    <!-- Top Summary Metric Cards (Desktop 3-columns, Mobile stacked) -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <!-- Total Balance Card -->
      <div class="rounded-[24px] bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
        <span class="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
          SALDO TOTAL
        </span>
        <div class="mt-3">
          <p class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
            {{ formatCurrency(store.summary.total_balance) }}
          </p>
        </div>
      </div>

      <!-- Credit Available Card -->
      <div class="rounded-[24px] bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
        <span class="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
          CRÉDITO DISPONÍVEL
        </span>
        <div class="mt-3">
          <p class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
            {{ formatCurrency(store.totalCreditAvailable) }}
          </p>
        </div>
      </div>

      <!-- Total Accounts Card -->
      <div class="rounded-[24px] bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
        <span class="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
          TOTAL DE CONTAS & CARTÕES
        </span>
        <div class="mt-3">
          <p class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
            {{ store.totalAccountsCount }}
          </p>
        </div>
      </div>
    </section>

    <!-- Accounts & Cards Grid (Desktop 3-columns, Mobile 1-column stacked) -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      <!-- 1. Bank Accounts -->
      <div
        v-for="acc in store.bankAccounts"
        :key="`bank-${acc.id}`"
        class="rounded-[26px] bg-white p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative group"
      >
        <!-- Card Top: Icon & Badges & Edit Button -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
              :style="{ backgroundColor: acc.color_hex || '#2563eb' }"
            >
              <Landmark class="w-5 h-5 stroke-[2.2]" />
            </div>

            <div class="flex items-center gap-1.5">
              <span
                v-if="acc.is_primary"
                class="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                ★ PRINCIPAL
              </span>
              <span class="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-600">
                CONTA BANCÁRIA
              </span>
              <button
                type="button"
                @click.stop="openEditAccount(acc)"
                title="Editar conta bancária"
                class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Pencil class="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          <!-- Account Name & Current Balance -->
          <p class="text-xs font-semibold text-slate-500">
            {{ acc.name }}
          </p>
          <p class="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight mt-1 font-mono">
            {{ formatCurrency(acc.current_balance) }}
          </p>

          <!-- Ownership & Sharing Indicator -->
          <div class="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-50 text-xs">
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                {{ acc.user?.name ? acc.user.name.charAt(0).toUpperCase() : (authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U') }}
              </div>
              <span class="text-[11px] font-bold text-slate-700 truncate max-w-[120px]" :title="acc.user?.name || authStore.user?.name">
                {{ (acc.user && acc.user.id === authStore.user?.id) || (!acc.user && authStore.user) ? `${acc.user?.name || authStore.user?.name} (Você)` : (acc.user?.name || 'Titular') }}
              </span>
            </div>

            <span
              :class="[
                'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0',
                acc.is_shared !== false
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/70'
                  : 'bg-slate-100 text-slate-500'
              ]"
            >
              {{ acc.is_shared !== false ? 'Compartilhada' : 'Individual' }}
            </span>
          </div>
        </div>

        <!-- Account Card Footer: Actions -->
        <div class="mt-5 pt-3 border-t border-slate-50">
          <button
            v-if="!acc.is_primary"
            type="button"
            @click="store.setPrimaryBankAccount(acc.id)"
            class="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200/70 hover:border-blue-200 text-xs font-semibold transition cursor-pointer text-center"
          >
            Tornar Conta Principal
          </button>
          <div v-else class="py-2 text-center">
            <span class="text-[11px] font-semibold text-emerald-600">
              ★ Conta Principal do Espaço
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Credit Cards -->
      <div
        v-for="card in store.creditCards"
        :key="`card-${card.id}`"
        class="rounded-[26px] bg-white p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative group"
      >
        <!-- Card Top: Icon & CREDIT/DEBIT Badge & Edit Button -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
              :style="{ backgroundColor: card.color_hex || '#ea580c' }"
            >
              <CreditCard class="w-5 h-5 stroke-[2.2]" />
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Linked Bank Account Badge -->
              <span
                v-if="card.bank_account"
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[110px]"
                :title="`Vinculado à conta ${card.bank_account.name}`"
              >
                🏦 {{ card.bank_account.name }}
              </span>

              <span
                :class="[
                  'text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md',
                  card.type === 'debit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                ]"
              >
                {{ card.type === 'debit' ? 'DÉBITO' : 'CRÉDITO' }}
              </span>

              <button
                type="button"
                @click.stop="openEditCard(card)"
                title="Editar cartão"
                class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Pencil class="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          <!-- Card Name & Used / Invoice Balance -->
          <p class="text-xs font-semibold text-slate-500">
            {{ card.name }} • <span class="text-slate-400">{{ card.brand }}</span>
          </p>
          <p class="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight mt-1 font-mono">
            {{ formatCurrency(card.used_limit || 0) }}
          </p>
          <div class="flex items-center justify-between text-xs font-medium text-slate-400 mt-1">
            <span>Limite {{ formatCurrency(card.total_limit) }}</span>
            <span class="text-emerald-600 font-semibold">Disp: {{ formatCurrency(card.available_limit) }}</span>
          </div>

          <!-- Ownership & Sharing Indicator -->
          <div class="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-50 text-xs">
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                {{ card.user?.name ? card.user.name.charAt(0).toUpperCase() : (authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U') }}
              </div>
              <span class="text-[11px] font-bold text-slate-700 truncate max-w-[120px]" :title="card.user?.name || authStore.user?.name">
                {{ (card.user && card.user.id === authStore.user?.id) || (!card.user && authStore.user) ? `${card.user?.name || authStore.user?.name} (Você)` : (card.user?.name || 'Titular') }}
              </span>
            </div>

            <span
              :class="[
                'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0',
                card.is_shared !== false
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/70'
                  : 'bg-slate-100 text-slate-500'
              ]"
            >
              {{ card.is_shared !== false ? 'Compartilhado' : 'Individual' }}
            </span>
          </div>
        </div>

        <!-- Progress Bar & Actions -->
        <div class="mt-5 pt-3 border-t border-slate-50 space-y-3">
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                CRÉDITO UTILIZADO
              </span>
              <span class="font-bold text-slate-700 font-mono text-xs">
                {{ card.used_percentage || 0 }}%
              </span>
            </div>
            <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-indigo-600 transition-all duration-300"
                :style="{ width: `${Math.min(100, card.used_percentage || 0)}%` }"
              />
            </div>
          </div>

          <!-- Statement Due Pill -->
          <div
            v-if="card.type !== 'debit'"
            class="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100/60 flex items-center justify-between text-xs"
          >
            <span class="font-extrabold text-[10px] tracking-wider uppercase text-rose-600">
              FATURA VENCE
            </span>
            <span class="font-bold text-rose-700">
              Dia {{ card.due_day }} • {{ getStatementDueDateText(card.due_day) }}
            </span>
          </div>

          <!-- Month-by-month limits evolution button -->
          <button
            v-if="card.type !== 'debit'"
            type="button"
            @click="openCardLimits(card)"
            class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <TrendingUp class="w-3.5 h-3.5 text-indigo-600" />
            <span>Ver Limite Mês a Mês</span>
          </button>
        </div>
      </div>

      <!-- 3. Add Bank Account Dashed Card -->
      <div
        @click="openCreateAccount"
        class="rounded-[26px] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 p-6 flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer group text-center select-none"
      >
        <div class="w-12 h-12 rounded-full border border-slate-200 group-hover:border-blue-400 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all mb-3 shadow-xs">
          <Landmark class="w-5 h-5 stroke-[2.2]" />
        </div>
        <p class="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
          + Adicionar Conta Bancária
        </p>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Cadastre uma nova conta corrente ou poupança
        </p>
      </div>

      <!-- 4. Add Card Dashed Card -->
      <div
        @click="openCreateCard"
        class="rounded-[26px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 p-6 flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer group text-center select-none"
      >
        <div class="w-12 h-12 rounded-full border border-slate-200 group-hover:border-indigo-400 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all mb-3 shadow-xs">
          <CreditCard class="w-5 h-5 stroke-[2.2]" />
        </div>
        <p class="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
          + Adicionar Cartão
        </p>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Vincule um cartão de crédito ou débito a uma conta
        </p>
      </div>
    </section>

    <!-- Modals -->
    <BankAccountModal
      :is-open="isBankAccountModalOpen"
      :account-to-edit="selectedAccountToEdit"
      @close="isBankAccountModalOpen = false; selectedAccountToEdit = null"
    />

    <CardModal
      :is-open="isCardModalOpen"
      :card-to-edit="selectedCardToEdit"
      @close="isCardModalOpen = false; selectedCardToEdit = null"
      @open-add-account="isCardModalOpen = false; selectedCardToEdit = null; openCreateAccount()"
    />

    <MonthlyLimitsModal
      :is-open="isLimitsModalOpen"
      :card="selectedCardForLimits"
      @close="isLimitsModalOpen = false; selectedCardForLimits = null"
    />
  </div>
</template>
