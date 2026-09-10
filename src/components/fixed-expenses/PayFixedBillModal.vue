<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Check, Building2, CreditCard as CreditCardIcon, AlertCircle } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'
import type { FixedBill } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  bill: FixedBill | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'paid'): void
}>()

const store = useDashboardStore()

const amount = ref<number>(0)
const paymentDate = ref<string>('')
const selectedPaymentTarget = ref<string>('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.bill) {
      amount.value = props.bill.is_paid && props.bill.current_payment?.amount
        ? props.bill.current_payment.amount
        : props.bill.estimated_amount

      paymentDate.value = props.bill.current_payment?.occurred_at || new Date().toISOString().split('T')[0] || ''

      if (props.bill.preferred_bank_account_id) {
        selectedPaymentTarget.value = `account_${props.bill.preferred_bank_account_id}`
      } else if (store.bankAccounts.length > 0 && store.bankAccounts[0]) {
        selectedPaymentTarget.value = `account_${store.bankAccounts[0].id}`
      } else {
        selectedPaymentTarget.value = ''
      }

      errorMessage.value = null
    }
  }
)

const handleSubmit = async () => {
  if (!props.bill) return

  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Informe um valor válido maior que zero.'
    return
  }

  let bankAccountId: number | undefined = undefined
  let creditCardId: number | undefined = undefined

  if (selectedPaymentTarget.value.startsWith('account_')) {
    bankAccountId = Number(selectedPaymentTarget.value.replace('account_', ''))
  } else if (selectedPaymentTarget.value.startsWith('card_')) {
    creditCardId = Number(selectedPaymentTarget.value.replace('card_', ''))
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    await store.payFixedBill(props.bill.id, {
      amount: Number(amount.value),
      payment_date: paymentDate.value || new Date().toISOString().split('T')[0],
      bank_account_id: bankAccountId,
      credit_card_id: creditCardId,
    })

    emit('paid')
    emit('close')
  } catch (err: any) {
    console.error('Erro ao registrar pagamento:', err)
    errorMessage.value = err.response?.data?.message || 'Falha ao registrar o pagamento. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && bill"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="min-w-0 pr-2">
          <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
            Pagar {{ bill.name }}
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Confirme o valor real pago e a data de liquidação
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {{ errorMessage }}
        </div>

        <!-- Valor Real Pago -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Valor Real Pago (R$) *
            </label>
            <span class="text-[11px] font-semibold text-slate-400">
              Estimado: {{ formatCurrency(bill.estimated_amount) }}
            </span>
          </div>

          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
            <input
              v-model.number="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              class="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              placeholder="0,00"
            />
          </div>
          <p class="text-[11px] text-slate-400 font-medium mt-1">
            Se a fatura de água ou luz variou este mês, digite o valor exato aqui.
          </p>
        </div>

        <!-- Data do Pagamento -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Data do Pagamento *
          </label>
          <input
            v-model="paymentDate"
            type="date"
            required
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          />
        </div>

        <!-- Meio de Pagamento / Conta Bancária -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Conta de Pagamento (Débito)
          </label>
          <select
            v-model="selectedPaymentTarget"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option value="">Nenhum / Apenas marcar como pago</option>
            <optgroup v-if="store.bankAccounts.length > 0" label="Contas Bancárias">
              <option
                v-for="acc in store.bankAccounts"
                :key="`acc-${acc.id}`"
                :value="`account_${acc.id}`"
              >
                🏦 {{ acc.name }} (Saldo: {{ formatCurrency(acc.current_balance) }})
              </option>
            </optgroup>
            <optgroup v-if="store.creditCards.length > 0" label="Cartões de Crédito">
              <option
                v-for="card in store.creditCards"
                :key="`card-${card.id}`"
                :value="`card_${card.id}`"
              >
                💳 {{ card.name }} ({{ card.brand }})
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Check class="w-4 h-4 stroke-[3]" />
            <span>{{ isSubmitting ? 'Registrando...' : 'Confirmar Pagamento' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
