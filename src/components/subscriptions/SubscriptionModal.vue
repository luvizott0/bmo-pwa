<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Users,
  Plus,
  Trash2,
  Sparkles,
  CreditCard as CreditCardIcon,
  Building2,
  HelpCircle,
  Check,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { Subscription } from '@/types/finance'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps<{
  isOpen: boolean
  subscriptionToEdit?: Subscription | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const store = useDashboardStore()
const isEditing = computed(() => !!props.subscriptionToEdit)

const servicePresets = [
  { name: 'Netflix', icon: 'NET', color: '#141414', category: 'Entretenimento', defaultAmount: 59.90 },
  { name: 'Spotify', icon: 'SPO', color: '#1db954', category: 'Música', defaultAmount: 34.90 },
  { name: 'YouTube Premium', icon: 'YOU', color: '#ef4444', category: 'Vídeo', defaultAmount: 41.90 },
  { name: 'iCloud+', icon: 'ICL', color: '#2563eb', category: 'Armazenamento', defaultAmount: 14.90 },
  { name: 'Amazon Prime', icon: 'PRM', color: '#00a8e1', category: 'Entretenimento', defaultAmount: 19.90 },
  { name: 'Disney+', icon: 'DIS', color: '#113ccf', category: 'Entretenimento', defaultAmount: 43.90 },
  { name: 'ChatGPT Plus', icon: 'GPT', color: '#10a37f', category: 'Inteligência Artificial', defaultAmount: 120.00 },
  { name: 'Max', icon: 'MAX', color: '#002be7', category: 'Streaming', defaultAmount: 39.90 },
]

const colorOptions = [
  '#6366f1',
  '#141414',
  '#e50914',
  '#1db954',
  '#00a8e1',
  '#2563eb',
  '#113ccf',
  '#10a37f',
  '#8b5cf6',
  '#ec4899',
  '#ea580c',
  '#f59e0b',
]

const serviceName = ref('')
const selectedColor = ref('#6366f1')
const totalAmount = ref<number | null>(null)
const billingDay = ref<number>(10)
const selectedPaymentTarget = ref<string>('')
const categoryName = ref('Entretenimento')
const notes = ref('')

const isFamilyPlan = ref(false)

interface MemberDraft {
  id: string
  name: string
  contact: string
  installment_amount: number
}

const members = ref<MemberDraft[]>([])
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// When selecting a preset
const applyPreset = (preset: typeof servicePresets[0]) => {
  serviceName.value = preset.name
  selectedColor.value = preset.color
  if (!totalAmount.value) {
    totalAmount.value = preset.defaultAmount
  }
  categoryName.value = preset.category
  recalculateMemberSplits()
}

// Reset form to defaults
function resetForm() {
  serviceName.value = ''
  selectedColor.value = '#6366f1'
  totalAmount.value = null
  billingDay.value = 10
  categoryName.value = 'Entretenimento'
  notes.value = ''
  isFamilyPlan.value = false
  errorMessage.value = null

  // Default payment target to first card or account
  if (store.creditCards.length > 0 && store.creditCards[0]) {
    selectedPaymentTarget.value = `card_${store.creditCards[0].id}`
  } else if (store.bankAccounts.length > 0 && store.bankAccounts[0]) {
    selectedPaymentTarget.value = `account_${store.bankAccounts[0].id}`
  } else {
    selectedPaymentTarget.value = ''
  }

  // Initial members for family plan
  const userName = store.summary.user_name || 'Você'
  members.value = [
    { id: '1', name: userName, contact: '', installment_amount: 0 },
    { id: '2', name: 'Amigo / Familiar', contact: '', installment_amount: 0 },
  ]
}

function populateForm() {
  if (props.subscriptionToEdit) {
    const sub = props.subscriptionToEdit
    serviceName.value = sub.service_name
    selectedColor.value = sub.color_hex || sub.icon_bg || '#6366f1'
    totalAmount.value = sub.total_amount
    billingDay.value = sub.billing_day || 10
    categoryName.value = sub.category_name || 'Entretenimento'
    notes.value = sub.notes || ''
    errorMessage.value = null

    if (sub.credit_card_id) {
      selectedPaymentTarget.value = `card_${sub.credit_card_id}`
    } else if (sub.bank_account_id) {
      selectedPaymentTarget.value = `account_${sub.bank_account_id}`
    } else {
      selectedPaymentTarget.value = ''
    }

    if (sub.members && sub.members.length > 0) {
      isFamilyPlan.value = true
      members.value = sub.members.map((m) => ({
        id: String(m.id),
        name: m.name,
        contact: m.contact || '',
        installment_amount: m.installment_amount,
      }))
    } else {
      isFamilyPlan.value = false
      const userName = store.summary.user_name || 'Você'
      members.value = [
        { id: '1', name: userName, contact: '', installment_amount: 0 },
        { id: '2', name: 'Amigo / Familiar', contact: '', installment_amount: 0 },
      ]
    }
  } else {
    resetForm()
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
  () => props.subscriptionToEdit,
  () => {
    if (props.isOpen) {
      populateForm()
    }
  }
)

const addMember = () => {
  const count = members.value.length + 1
  members.value.push({
    id: String(Date.now()),
    name: `Membro ${count}`,
    contact: '',
    installment_amount: 0,
  })
  recalculateMemberSplits()
}

const removeMember = (index: number) => {
  if (members.value.length <= 1) return
  members.value.splice(index, 1)
  recalculateMemberSplits()
}

const recalculateMemberSplits = () => {
  if (!totalAmount.value || members.value.length === 0) return
  const total = Number(totalAmount.value)
  const count = members.value.length
  const split = Math.round((total / count) * 100) / 100

  members.value.forEach((m) => {
    m.installment_amount = split
  })
}

watch(totalAmount, () => {
  if (isFamilyPlan.value) {
    recalculateMemberSplits()
  }
})

watch(isFamilyPlan, (enabled) => {
  if (enabled && members.value.length === 0) {
    const userName = store.summary.user_name || 'Você'
    members.value = [
      { id: '1', name: userName, contact: '', installment_amount: 0 },
      { id: '2', name: 'Membro 2', contact: '', installment_amount: 0 },
    ]
  }
  if (enabled) {
    recalculateMemberSplits()
  }
})

const handleSubmit = async () => {
  if (!serviceName.value.trim() || !totalAmount.value || totalAmount.value <= 0) {
    errorMessage.value = 'Preencha o nome do serviço e o valor mensal.'
    return
  }

  if (billingDay.value < 1 || billingDay.value > 31) {
    errorMessage.value = 'O dia de vencimento deve estar entre 1 e 31.'
    return
  }

  let creditCardId: number | null = null
  let bankAccountId: number | null = null

  if (selectedPaymentTarget.value.startsWith('card_')) {
    creditCardId = Number(selectedPaymentTarget.value.replace('card_', ''))
  } else if (selectedPaymentTarget.value.startsWith('account_')) {
    bankAccountId = Number(selectedPaymentTarget.value.replace('account_', ''))
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload: any = {
      service_name: serviceName.value.trim(),
      color_hex: selectedColor.value,
      total_amount: Number(totalAmount.value),
      billing_day: Number(billingDay.value),
      credit_card_id: creditCardId,
      bank_account_id: bankAccountId,
      notes: notes.value.trim() || null,
    }

    if (isFamilyPlan.value && members.value.length > 0) {
      payload.members = members.value.map((m) => {
        const isDbId = m.id && !m.id.includes('-') && Number(m.id) < 1000000000000
        return {
          ...(isDbId ? { id: Number(m.id) } : {}),
          name: m.name.trim() || 'Participante',
          installment_amount: Number(m.installment_amount) || Math.round((Number(totalAmount.value) / members.value.length) * 100) / 100,
          contact: m.contact.trim() || null,
        }
      })
    } else if (isEditing.value && !isFamilyPlan.value) {
      payload.members = []
    }

    if (isEditing.value && props.subscriptionToEdit) {
      await store.updateSubscription(props.subscriptionToEdit.id, payload)
      emit('updated')
    } else {
      await store.createSubscription(payload)
      emit('created')
    }

    emit('close')
  } catch (err: any) {
    console.error('Erro ao salvar assinatura:', err)
    errorMessage.value = err.response?.data?.message || 'Falha ao salvar a assinatura. Verifique os dados.'
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
    <div class="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {{ isEditing ? 'Editar Assinatura' : 'Nova Assinatura' }}
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            {{ isEditing ? 'Atualize o valor, meio de cobrança ou participantes' : 'Cadastre um plano individual ou compartilhe com familiares' }}
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Quick Presets -->
      <div v-if="!isEditing" class="mt-4">
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Sugestões Populares
        </label>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="preset in servicePresets"
            :key="preset.name"
            type="button"
            @click="applyPreset(preset)"
            :class="[
              'px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer',
              serviceName === preset.name
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
            ]"
          >
            <span
              class="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black text-white"
              :style="{ backgroundColor: preset.color }"
            >
              {{ preset.icon[0] }}
            </span>
            <span>{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {{ errorMessage }}
        </div>

        <!-- Nome do Serviço & Ícone Prévia -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Nome do Serviço *
          </label>
          <div class="flex items-center gap-2.5">
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-2xs transition-colors duration-200"
              :style="{ backgroundColor: selectedColor }"
              title="Prévia da cor e ícone"
            >
              {{ serviceName ? serviceName.trim().slice(0, 3).toUpperCase() : 'SUB' }}
            </div>
            <input
              v-model="serviceName"
              type="text"
              required
              placeholder="Ex: Netflix Família, Spotify Duo, ChatGPT"
              class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Seletor de Cores -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Cor de Identificação
          </label>
          <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              v-for="c in colorOptions"
              :key="c"
              type="button"
              @click="selectedColor = c"
              class="w-7 h-7 rounded-full shrink-0 transition-transform flex items-center justify-center cursor-pointer shadow-2xs"
              :class="[
                selectedColor.toLowerCase() === c.toLowerCase()
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                  : 'hover:scale-105'
              ]"
              :style="{ backgroundColor: c }"
            >
              <Check
                v-if="selectedColor.toLowerCase() === c.toLowerCase()"
                class="w-3.5 h-3.5 text-white stroke-[3]"
              />
            </button>

            <!-- Custom Color Picker -->
            <label
              class="w-7 h-7 rounded-full shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:scale-105 transition relative overflow-hidden"
              title="Escolher cor personalizada"
            >
              <input
                type="color"
                v-model="selectedColor"
                class="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <span class="text-xs font-bold text-slate-400">+</span>
            </label>
          </div>
        </div>

        <!-- Valor Mensal e Dia de Vencimento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Valor Mensal (R$) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input
                v-model="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                class="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Dia da Cobrança *
            </label>
            <input
              v-model="billingDay"
              type="number"
              min="1"
              max="31"
              required
              placeholder="10"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Meio de Pagamento -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Forma de Pagamento (Cartão ou Conta)
          </label>
          <select
            v-model="selectedPaymentTarget"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option value="">Nenhum / Selecionar depois</option>
            <optgroup v-if="store.creditCards.length > 0" label="Cartões de Crédito">
              <option
                v-for="card in store.creditCards"
                :key="`card-${card.id}`"
                :value="`card_${card.id}`"
              >
                💳 {{ card.name }} ({{ card.brand }})
              </option>
            </optgroup>
            <optgroup v-if="store.bankAccounts.length > 0" label="Contas Bancárias (Débito)">
              <option
                v-for="acc in store.bankAccounts"
                :key="`acc-${acc.id}`"
                :value="`account_${acc.id}`"
              >
                🏦 {{ acc.name }}
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Toggle Plano Família / Rateio -->
        <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 leading-tight">
                Plano em Família / Rateio
              </h4>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Divida com amigos e controle quem já pagou
              </p>
            </div>
          </div>

          <!-- Switch -->
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input v-model="isFamilyPlan" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <!-- Seção de Membros (apenas se Plano Família estiver ativo) -->
        <div v-if="isFamilyPlan" class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Participantes do Rateio ({{ members.length }})
            </span>
            <button
              type="button"
              @click="addMember"
              class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Adicionar Amigo/Familiar</span>
            </button>
          </div>

          <!-- Lista de Membros -->
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="(member, idx) in members"
              :key="member.id"
              class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <input
                v-model="member.name"
                type="text"
                required
                placeholder="Nome do amigo"
                class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div class="w-24 relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">R$</span>
                <input
                  v-model.number="member.installment_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  class="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                v-if="members.length > 1"
                type="button"
                @click="removeMember(idx)"
                class="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
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
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {{ isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Assinatura') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
