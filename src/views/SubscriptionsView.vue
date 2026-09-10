<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, RefreshCw, Sparkles, Layers } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard.vue'
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal.vue'

const store = useDashboardStore()
const isModalOpen = ref(false)

onMounted(async () => {
  await store.fetchDashboardData()
})

const activeCount = computed(() => {
  return store.familySubscriptions.length
})

const familyCount = computed(() => {
  return store.familySubscriptions.filter(s => s.is_family).length
})

const totalMonthlyAmount = computed(() => {
  return store.familySubscriptions.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
})

const handleToggleMember = async (subId: number, memberId: number) => {
  await store.toggleMemberPayment(subId, memberId)
}

const handleDelete = async (subId: number) => {
  const confirmed = window.confirm('Tem certeza que deseja excluir esta assinatura?')
  if (confirmed) {
    await store.deleteSubscription(subId)
  }
}

const handleCreated = async () => {
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
            @click="store.fetchDashboardData"
            :title="store.isFetching ? 'Atualizando...' : 'Atualizar com a API'"
            class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw :class="['w-4 h-4', store.isFetching ? 'animate-spin text-indigo-600' : '']" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {{ activeCount }} ativas • {{ familyCount }} planos família • {{ formatCurrency(totalMonthlyAmount) }}/mês
        </p>
      </div>

      <!-- Action Button -->
      <div>
        <button
          type="button"
          @click="isModalOpen = true"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer text-center"
        >
          <Plus class="w-4 h-4" />
          <span>Nova Assinatura</span>
        </button>
      </div>
    </header>

    <!-- Subscriptions Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
      <!-- Active Subscriptions Cards -->
      <SubscriptionCard
        v-for="sub in store.familySubscriptions"
        :key="sub.id"
        :subscription="sub"
        @toggle-member="handleToggleMember"
        @delete="handleDelete"
      />

      <!-- Dashed Add Card (Matches screenshot layout) -->
      <button
        type="button"
        @click="isModalOpen = true"
        class="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-[26px] p-8 flex flex-col items-center justify-center gap-3 min-h-[220px] transition-all duration-200 cursor-pointer group text-center"
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

    <!-- Empty State (if no subscriptions exist yet) -->
    <div
      v-if="store.familySubscriptions.length === 0"
      class="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl bg-white p-8 shadow-xs"
    >
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Sparkles class="w-7 h-7" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">
        Nenhuma assinatura ativa cadastrada
      </h3>
      <p class="text-xs text-slate-400 max-w-sm mt-1 mb-5">
        Cadastre seus serviços como Netflix, Spotify ou iCloud e divida os custos com seus amigos e familiares facilmente.
      </p>
      <button
        type="button"
        @click="isModalOpen = true"
        class="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Cadastrar Primeira Assinatura</span>
      </button>
    </div>

    <!-- Create Subscription Modal -->
    <SubscriptionModal
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @created="handleCreated"
    />
  </div>
</template>
