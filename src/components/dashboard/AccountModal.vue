<script setup lang="ts">
import { ref } from 'vue'
import { X, Landmark, CreditCard as CardIcon } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()

const badge = ref<'DEBIT' | 'CREDIT'>('DEBIT')

// Debit / Bank Account fields
const name = ref('')
const bankName = ref('')
const balance = ref<number | null>(null)
const accountNumber = ref('')

// Credit Card fields
const cardName = ref('')
const brand = ref('Mastercard')
const totalLimit = ref<number | null>(null)
const closingDay = ref<number>(5)
const dueDay = ref<number>(12)

const colors: string[] = ['#2563eb', '#ea580c', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#0f172a']
const colorHex = ref<string>(colors[0] ?? '#2563eb')

const brands = ['Mastercard', 'Visa', 'American Express', 'Elo', 'Outro']

const handleSubmit = async () => {
  if (badge.value === 'DEBIT') {
    if (!name.value || balance.value === null) return

    await store.addAccount({
      name: name.value,
      bank_name: bankName.value || name.value,
      type: 'checking',
      current_balance: Number(balance.value),
      color_hex: colorHex.value,
      is_active: true,
      badge: 'DEBIT',
      account_number: accountNumber.value ? `•••• ${accountNumber.value.slice(-4)}` : '•••• 1234',
    })
  } else {
    if (!cardName.value || totalLimit.value === null) return

    await store.addCreditCard({
      bank_account_id: store.bankAccounts[0]?.id || 1,
      type: 'credit',
      name: cardName.value,
      brand: brand.value,
      total_limit: Number(totalLimit.value),
      closing_day: Number(closingDay.value || 5),
      due_day: Number(dueDay.value || 12),
      color_hex: colorHex.value,
      card_last_digits: accountNumber.value ? `•••• ${accountNumber.value.slice(-4)}` : '•••• 8821',
    })
  }

  // Reset
  name.value = ''
  bankName.value = ''
  balance.value = null
  cardName.value = ''
  totalLimit.value = null
  accountNumber.value = ''
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-900">
          {{ badge === 'DEBIT' ? 'Nova Conta Bancária' : 'Novo Cartão de Crédito' }}
        </h3>
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Type: Debit or Credit -->
        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            @click="badge = 'DEBIT'"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              badge === 'DEBIT' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <Landmark class="w-4 h-4 stroke-[2.2]" />
            <span>Conta / Débito</span>
          </button>
          <button
            type="button"
            @click="badge = 'CREDIT'"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              badge === 'CREDIT' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <CardIcon class="w-4 h-4 stroke-[2.2]" />
            <span>Cartão de Crédito</span>
          </button>
        </div>

        <!-- Fields for Bank Account -->
        <template v-if="badge === 'DEBIT'">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome da Conta
            </label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ex: Chase Sapphire, Nubank, Inter"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Saldo Atual (R$)
            </label>
            <input
              v-model="balance"
              type="number"
              step="0.01"
              required
              placeholder="4250.00"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </template>

        <!-- Fields for Credit Card -->
        <template v-else>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome do Cartão
            </label>
            <input
              v-model="cardName"
              type="text"
              required
              placeholder="Ex: Amex Gold, Nubank Ultravioleta"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Bandeira
              </label>
              <select
                v-model="brand"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Limite Total (R$)
              </label>
              <input
                v-model="totalLimit"
                type="number"
                step="0.01"
                required
                placeholder="15000.00"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Dia Fechamento
              </label>
              <input
                v-model="closingDay"
                type="number"
                min="1"
                max="31"
                required
                placeholder="5"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Dia Vencimento
              </label>
              <input
                v-model="dueDay"
                type="number"
                min="1"
                max="31"
                required
                placeholder="12"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </template>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Últimos 4 dígitos (opcional)
          </label>
          <input
            v-model="accountNumber"
            type="text"
            maxlength="4"
            placeholder="1234"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Cor de Identificação
          </label>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              @click="colorHex = color"
              :class="[
                'w-8 h-8 rounded-full transition-transform cursor-pointer',
                colorHex === color ? 'ring-3 ring-indigo-300 scale-110' : 'hover:scale-105'
              ]"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3.5 rounded-2xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 transition-all cursor-pointer mt-2"
        >
          {{ badge === 'DEBIT' ? 'Salvar Conta' : 'Salvar Cartão' }}
        </button>
      </form>
    </div>
  </div>
</template>
