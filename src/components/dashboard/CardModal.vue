<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, CreditCard as CardIcon, Landmark, AlertCircle, Users } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import type { CreditCard } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  cardToEdit?: CreditCard | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openAddAccount'): void
}>()

const store = useDashboardStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!props.cardToEdit)

const cardType = ref<'credit' | 'debit'>('credit')
const bankAccountId = ref<number | undefined>(store.bankAccounts[0]?.id)
const cardName = ref('')
const brand = ref('Mastercard')
const totalLimit = ref<number | null>(null)
const dailyLimit = ref<number | null>(null)
const closingDay = ref<number>(5)
const dueDay = ref<number>(12)
const lastDigits = ref('')
const isShared = ref(true)
const userId = ref<number | null>(null)

const colors: string[] = ['#ea580c', '#2563eb', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#0f172a']
const colorHex = ref<string>(colors[0] ?? '#ea580c')
const brands = ['Mastercard', 'Visa', 'American Express', 'Elo', 'Hipercard', 'Outro']

const hasBankAccounts = computed(() => store.bankAccounts.length > 0)
const isSubmitting = ref(false)

const availableMembers = computed(() => {
  if (store.workspaceMembers && store.workspaceMembers.length > 0) {
    return store.workspaceMembers
  }
  if (authStore.user) {
    return [{ id: authStore.user.id, name: authStore.user.name, email: authStore.user.email }]
  }
  return []
})

const populateForm = () => {
  if (props.cardToEdit) {
    cardType.value = props.cardToEdit.type === 'debit' ? 'debit' : 'credit'
    bankAccountId.value = props.cardToEdit.bank_account_id ?? store.bankAccounts[0]?.id
    cardName.value = props.cardToEdit.name
    brand.value = props.cardToEdit.brand || 'Mastercard'
    totalLimit.value = Number(props.cardToEdit.total_limit || 0)
    dailyLimit.value = props.cardToEdit.daily_limit ? Number(props.cardToEdit.daily_limit) : null
    closingDay.value = Number(props.cardToEdit.closing_day || 5)
    dueDay.value = Number(props.cardToEdit.due_day || 12)
    lastDigits.value = props.cardToEdit.card_last_digits ? props.cardToEdit.card_last_digits.replace(/[^0-9]/g, '').slice(-4) : ''
    colorHex.value = props.cardToEdit.color_hex || colors[0] || '#ea580c'
    isShared.value = props.cardToEdit.is_shared !== undefined ? !!props.cardToEdit.is_shared : true
    userId.value = props.cardToEdit.user_id ?? props.cardToEdit.user?.id ?? authStore.user?.id ?? null
  } else {
    cardType.value = 'credit'
    bankAccountId.value = store.bankAccounts[0]?.id
    cardName.value = ''
    brand.value = 'Mastercard'
    totalLimit.value = null
    dailyLimit.value = null
    closingDay.value = 5
    dueDay.value = 12
    lastDigits.value = ''
    colorHex.value = colors[0] ?? '#ea580c'
    isShared.value = true
    userId.value = authStore.user?.id ?? null
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      populateForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.cardToEdit,
  () => {
    if (props.isOpen) {
      populateForm()
    }
  }
)

const handleSubmit = async () => {
  if (!cardName.value.trim() || !bankAccountId.value) return
  if (cardType.value === 'credit' && totalLimit.value === null) return

  isSubmitting.value = true
  try {
    if (isEditing.value && props.cardToEdit) {
      await store.updateCreditCard(props.cardToEdit.id, {
        bank_account_id: Number(bankAccountId.value),
        type: cardType.value,
        name: cardName.value.trim(),
        brand: brand.value,
        total_limit: cardType.value === 'credit' ? Number(totalLimit.value) : 0,
        daily_limit: cardType.value === 'debit' && dailyLimit.value ? Number(dailyLimit.value) : undefined,
        closing_day: cardType.value === 'credit' ? Number(closingDay.value || 5) : undefined,
        due_day: cardType.value === 'credit' ? Number(dueDay.value || 12) : undefined,
        color_hex: colorHex.value,
        is_shared: isShared.value,
        user_id: userId.value,
      })
    } else {
      await store.addCreditCard({
        bank_account_id: Number(bankAccountId.value),
        type: cardType.value,
        name: cardName.value.trim(),
        brand: brand.value,
        total_limit: cardType.value === 'credit' ? Number(totalLimit.value) : 0,
        daily_limit: cardType.value === 'debit' && dailyLimit.value ? Number(dailyLimit.value) : undefined,
        closing_day: cardType.value === 'credit' ? Number(closingDay.value || 5) : undefined,
        due_day: cardType.value === 'credit' ? Number(dueDay.value || 12) : undefined,
        color_hex: colorHex.value,
        card_last_digits: lastDigits.value ? `•••• ${lastDigits.value.slice(-4)}` : undefined,
        is_shared: isShared.value,
        user_id: userId.value,
      })
    }

    emit('close')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CardIcon class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {{ isEditing ? 'Editar Cartão' : 'Novo Cartão' }}
            </h3>
            <p class="text-xs text-slate-400">
              {{ isEditing ? 'Atualize as informações e limites do seu cartão' : 'Cartão vinculado a uma conta bancária' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Warning if no bank accounts exist -->
      <div
        v-if="!hasBankAccounts"
        class="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div class="text-xs text-amber-800">
          <p class="font-bold">Nenhuma conta bancária encontrada.</p>
          <p class="mt-0.5">
            Todo cartão precisa estar vinculado a uma conta bancária.
          </p>
          <button
            type="button"
            @click="emit('openAddAccount')"
            class="mt-2 inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline cursor-pointer"
          >
            <Landmark class="w-3.5 h-3.5" />
            Cadastrar Conta Bancária Primeiro
          </button>
        </div>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Toggle: Crédito ou Débito -->
        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            @click="cardType = 'credit'"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              cardType === 'credit' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <CardIcon class="w-4 h-4 stroke-[2.2]" />
            <span>Cartão de Crédito</span>
          </button>
          <button
            type="button"
            @click="cardType = 'debit'"
            :class="[
              'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              cardType === 'debit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <Landmark class="w-4 h-4 stroke-[2.2]" />
            <span>Cartão de Débito</span>
          </button>
        </div>

        <!-- Titular do Cartão -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Titular do Cartão</span>
            <span class="text-[10px] text-slate-400 font-normal lowercase">a quem pertence</span>
          </label>
          <select
            v-model="userId"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option
              v-for="member in availableMembers"
              :key="member.id"
              :value="member.id"
            >
              {{ member.name }} {{ member.id === authStore.user?.id ? '(Você)' : '' }}
            </option>
          </select>
        </div>

        <!-- Conta Bancária Vinculada -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Conta Bancária Vinculada
          </label>
          <select
            v-model="bankAccountId"
            required
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option v-for="acc in store.bankAccounts" :key="acc.id" :value="acc.id">
              {{ acc.name }} (Saldo: R$ {{ Number(acc.current_balance).toFixed(2) }})
            </option>
          </select>
        </div>

        <!-- Nome do Cartão -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Nome do Cartão
          </label>
          <input
            v-model="cardName"
            type="text"
            required
            placeholder="Ex: Nubank Ultravioleta, Inter Black, Amex"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <!-- Bandeira & Limite -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Bandeira
            </label>
            <select
              v-model="brand"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
            >
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Limite Total para Crédito / Limite Diário para Débito -->
          <div v-if="cardType === 'credit'">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Limite Total (R$)
            </label>
            <input
              v-model="totalLimit"
              type="number"
              step="0.01"
              required
              placeholder="10000.00"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <div v-else>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Limite Diário (R$)
            </label>
            <input
              v-model="dailyLimit"
              type="number"
              step="0.01"
              placeholder="Ex: 5000.00"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Dias de Fechamento e Vencimento (apenas Crédito) -->
        <div v-if="cardType === 'credit'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Dia de Fechamento
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
              Dia de Vencimento
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

        <!-- Últimos 4 dígitos -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Últimos 4 dígitos (opcional)
          </label>
          <input
            v-model="lastDigits"
            type="text"
            maxlength="4"
            placeholder="Ex: 8821"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
          />
        </div>

        <!-- Cartão Compartilhado Toggle -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-900">Cartão Compartilhado</p>
              <p class="text-[11px] text-slate-400 font-medium truncate">
                Visível para outros membros do espaço
              </p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" v-model="isShared" class="sr-only peer" />
            <div class="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <!-- Cor de Identificação -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Cor do Cartão
          </label>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              @click="colorHex = color"
              :class="[
                'w-7 h-7 rounded-full transition-transform cursor-pointer',
                colorHex === color ? 'ring-3 ring-indigo-300 scale-110' : 'hover:scale-105'
              ]"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 rounded-2xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 shadow-md shadow-indigo-600/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
        >
          <span v-if="isSubmitting">Salvando Cartão...</span>
          <span v-else>{{ isEditing ? 'Salvar Alterações' : 'Salvar Cartão' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
