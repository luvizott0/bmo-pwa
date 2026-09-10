<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, ArrowUpRight, ArrowDownRight, CreditCard as CardIcon, Landmark, Layers, Calendar } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps<{
  isOpen: boolean
  initialType?: 'income' | 'expense'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'transaction-created'): void
}>()

const store = useDashboardStore()

const type = ref<'income' | 'expense'>('expense')
const amount = ref<number | null>(null)
const description = ref('')
const selectedPaymentTarget = ref<string>('') // e.g. 'account_1' or 'card_1'
const category = ref('Geral')

// Installment fields
const isInstallment = ref(false)
const installmentsCount = ref(2)

const categories = ['Geral', 'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Serviços']

// Reset default target helper
function resetPaymentTarget() {
  if (type.value === 'expense') {
    // Prefer credit card if available, else first bank account
    if (store.creditCards.length > 0 && store.creditCards[0]) {
      selectedPaymentTarget.value = `card_${store.creditCards[0].id}`
    } else if (store.bankAccounts.length > 0 && store.bankAccounts[0]) {
      selectedPaymentTarget.value = `account_${store.bankAccounts[0].id}`
    } else {
      selectedPaymentTarget.value = ''
    }
  } else {
    // For income, only bank accounts
    if (store.bankAccounts.length > 0 && store.bankAccounts[0]) {
      selectedPaymentTarget.value = `account_${store.bankAccounts[0].id}`
    } else {
      selectedPaymentTarget.value = ''
    }
  }
}

// Watch initialType
watch(
  () => props.initialType,
  (newVal) => {
    if (newVal) {
      type.value = newVal
      resetPaymentTarget()
    }
  },
  { immediate: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetPaymentTarget()
    }
  }
)

// Computed helpers
const isCreditCardSelected = computed(() => {
  return selectedPaymentTarget.value.startsWith('card_')
})

const selectedCard = computed(() => {
  if (!isCreditCardSelected.value) return null
  const cardId = Number(selectedPaymentTarget.value.replace('card_', ''))
  return store.creditCards.find((c) => c.id === cardId) || null
})

const installmentAmount = computed(() => {
  if (!amount.value || installmentsCount.value <= 1) return 0
  return Math.round((Number(amount.value) / installmentsCount.value) * 100) / 100
})

const estimatedFirstDueDateText = computed(() => {
  if (!selectedCard.value) return ''
  const today = new Date()
  const currentDay = today.getDate()
  const closingDay = selectedCard.value.closing_day
  const dueDay = selectedCard.value.due_day

  // If after closing day, first invoice is next month
  let invoiceMonth = today.getMonth() + (currentDay >= closingDay ? 2 : 1)
  let invoiceYear = today.getFullYear()
  if (invoiceMonth > 12) {
    invoiceMonth -= 12
    invoiceYear += 1
  }

  return `Dia ${dueDay}/${String(invoiceMonth).padStart(2, '0')}/${invoiceYear}`
})

const handleSubmit = async () => {
  if (!amount.value || amount.value <= 0) return

  const numAmount = Number(amount.value)
  const desc = description.value.trim() || (type.value === 'income' ? 'Nova Receita' : 'Nova Despesa')

  if (isCreditCardSelected.value && selectedCard.value) {
    await store.addTransaction({
      type: 'expense',
      amount: numAmount,
      description: desc,
      credit_card_id: selectedCard.value.id,
      bank_account_id: undefined,
      category: category.value,
      is_installment: isInstallment.value,
      installments_count: isInstallment.value ? installmentsCount.value : 1,
    })
  } else {
    const accId = selectedPaymentTarget.value.startsWith('account_')
      ? Number(selectedPaymentTarget.value.replace('account_', ''))
      : store.bankAccounts[0]?.id

    await store.addTransaction({
      type: type.value,
      amount: numAmount,
      description: desc,
      bank_account_id: accId,
      category: category.value,
    })
  }

  // Reset & close
  amount.value = null
  description.value = ''
  isInstallment.value = false
  installmentsCount.value = 2
  emit('transaction-created')
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-900">
          {{ type === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa' }}
        </h3>
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Type Selector Tabs -->
        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            @click="type = 'income'; resetPaymentTarget()"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <ArrowUpRight class="w-4 h-4 stroke-[2.5]" />
            <span>Receita</span>
          </button>
          <button
            type="button"
            @click="type = 'expense'; resetPaymentTarget()"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              type === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <ArrowDownRight class="w-4 h-4 stroke-[2.5]" />
            <span>Despesa</span>
          </button>
        </div>

        <!-- Valor Input -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Valor (R$)
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
            <input
              v-model="amount"
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Descrição Input -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Descrição
          </label>
          <input
            v-model="description"
            type="text"
            placeholder="Ex: Supermercado, Salário, Compra Notebook"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <!-- Forma de Pagamento / Destino -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {{ type === 'income' ? 'Conta de Destino' : 'Forma de Pagamento' }}
          </label>
          <select
            v-model="selectedPaymentTarget"
            required
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <!-- Credit Cards for Expenses -->
            <optgroup v-if="type === 'expense' && store.creditCards.length > 0" label="Cartões de Crédito">
              <option
                v-for="card in store.creditCards"
                :key="`card-${card.id}`"
                :value="`card_${card.id}`"
              >
                💳 {{ card.name }} (Limite Disp: {{ formatCurrency(card.available_limit) }})
              </option>
            </optgroup>

            <!-- Bank Accounts -->
            <optgroup :label="type === 'income' ? 'Contas Bancárias' : 'Contas Bancárias (Débito)'">
              <option
                v-for="acc in store.bankAccounts"
                :key="`acc-${acc.id}`"
                :value="`account_${acc.id}`"
              >
                🏦 {{ acc.name }} (Saldo: {{ formatCurrency(acc.current_balance) }})
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Categoria -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Categoria
          </label>
          <select
            v-model="category"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Opção de Compra Parcelada (Disponível para Cartões de Crédito em Despesa) -->
        <div
          v-if="type === 'expense' && isCreditCardSelected"
          class="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-indigo-600" />
              <label for="installment-toggle" class="text-xs font-bold text-slate-800 cursor-pointer">
                Compra Parcelada?
              </label>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                id="installment-toggle"
                v-model="isInstallment"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <!-- Installment Options when enabled -->
          <div v-if="isInstallment" class="space-y-3 pt-2 border-t border-indigo-100/60">
            <div>
              <label class="block text-[11px] font-extrabold uppercase text-indigo-700 tracking-wider mb-1">
                Quantidade de Parcelas
              </label>
              <select
                v-model.number="installmentsCount"
                class="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option v-for="n in 35" :key="n + 1" :value="n + 1">
                  {{ n + 1 }}x sem juros {{ amount ? `(${formatCurrency(Number(amount) / (n + 1))}/mês)` : '' }}
                </option>
              </select>
            </div>

            <!-- Installment Simulation Box -->
            <div v-if="amount && amount > 0" class="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium">Parcelamento:</span>
                <span class="font-extrabold text-indigo-700 font-mono">
                  {{ installmentsCount }}x de {{ formatCurrency(installmentAmount) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400 font-medium flex items-center gap-1">
                  <Calendar class="w-3 h-3 text-slate-400" />
                  1ª Fatura:
                </span>
                <span class="font-semibold text-slate-700">
                  {{ estimatedFirstDueDateText }}
                </span>
              </div>
              <div class="pt-1.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Impacto no limite do cartão:</span>
                <span class="font-mono font-bold text-rose-600">-{{ formatCurrency(amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :class="[
            'w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-2',
            type === 'income'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
          ]"
        >
          <span v-if="isInstallment && type === 'expense'">
            Confirmar Compra Parcelada ({{ installmentsCount }}x)
          </span>
          <span v-else>
            Confirmar e Salvar
          </span>
        </button>
      </form>
    </div>
  </div>
</template>
