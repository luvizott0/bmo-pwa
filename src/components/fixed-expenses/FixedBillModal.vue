<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  X,
  Droplets,
  Zap,
  Wifi,
  Home,
  Building,
  Flame,
  Receipt,
  Check,
  Building2,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const store = useDashboardStore()

const billPresets = [
  { name: 'Água', icon: Droplets, color: '#0ea5e9', defaultAmount: 85.00, category: 'Habitação' },
  { name: 'Energia Elétrica (Luz)', icon: Zap, color: '#f59e0b', defaultAmount: 180.00, category: 'Habitação' },
  { name: 'Internet Fibra', icon: Wifi, color: '#6366f1', defaultAmount: 119.90, category: 'Serviços' },
  { name: 'Aluguel', icon: Home, color: '#10b981', defaultAmount: 1500.00, category: 'Moradia' },
  { name: 'Condomínio', icon: Building, color: '#8b5cf6', defaultAmount: 420.00, category: 'Moradia' },
  { name: 'Gás', icon: Flame, color: '#ea580c', defaultAmount: 95.00, category: 'Habitação' },
]

const colorOptions = [
  '#0ea5e9', // Azul Água
  '#f59e0b', // Âmbar Luz
  '#6366f1', // Índigo Internet
  '#10b981', // Esmeralda Aluguel
  '#8b5cf6', // Roxo Condomínio
  '#ea580c', // Laranja Gás
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#0284c7', // Azul Royal
  '#141414', // Preto
]

const name = ref('')
const selectedColor = ref('#0ea5e9')
const estimatedAmount = ref<number | null>(null)
const dueDay = ref<number>(10)
const selectedBankAccountId = ref<number | null>(null)
const notes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

function resetForm() {
  name.value = ''
  selectedColor.value = '#0ea5e9'
  estimatedAmount.value = null
  dueDay.value = 10
  notes.value = ''
  errorMessage.value = null

  if (store.bankAccounts.length > 0 && store.bankAccounts[0]) {
    selectedBankAccountId.value = store.bankAccounts[0].id
  } else {
    selectedBankAccountId.value = null
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

const applyPreset = (preset: typeof billPresets[0]) => {
  name.value = preset.name
  selectedColor.value = preset.color
  if (!estimatedAmount.value) {
    estimatedAmount.value = preset.defaultAmount
  }
}

const handleSubmit = async () => {
  if (!name.value.trim() || !estimatedAmount.value || estimatedAmount.value <= 0) {
    errorMessage.value = 'Preencha o nome da despesa e o valor estimado.'
    return
  }

  if (dueDay.value < 1 || dueDay.value > 31) {
    errorMessage.value = 'O dia de vencimento deve estar entre 1 e 31.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload = {
      name: name.value.trim(),
      color_hex: selectedColor.value,
      type: 'expense',
      estimated_amount: Number(estimatedAmount.value),
      due_day: Number(dueDay.value),
      preferred_bank_account_id: selectedBankAccountId.value || null,
      is_reminder_active: true,
      reminder_days_before: 3,
      notes: notes.value.trim() || null,
    }

    await store.createFixedBill(payload)
    emit('created')
    emit('close')
  } catch (err: any) {
    console.error('Erro ao cadastrar despesa fixa:', err)
    errorMessage.value = err.response?.data?.message || 'Falha ao cadastrar a despesa. Verifique os dados.'
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
            Nova Conta Essencial
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Cadastre água, luz, internet, aluguel ou condomínio
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
      <div class="mt-4">
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Sugestões Rápidas
        </label>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="preset in billPresets"
            :key="preset.name"
            type="button"
            @click="applyPreset(preset)"
            :class="[
              'px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer',
              name === preset.name
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
            ]"
          >
            <span
              class="w-4 h-4 rounded-md flex items-center justify-center text-white"
              :style="{ backgroundColor: preset.color }"
            >
              <component :is="preset.icon" class="w-3 h-3 stroke-[2.5]" />
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

        <!-- Nome da Conta & Prévia -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Nome da Despesa / Conta *
          </label>
          <div class="flex items-center gap-2.5">
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs transition-colors duration-200"
              :style="{ backgroundColor: selectedColor }"
              title="Prévia da cor da conta"
            >
              <Receipt class="w-5 h-5 stroke-[2.5]" />
            </div>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ex: Energia Elétrica (Copel), Água (Sanepar), Aluguel"
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

        <!-- Valor Estimado e Dia de Vencimento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Valor Estimado (R$) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input
                v-model.number="estimatedAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                class="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <span class="text-[10px] text-slate-400 font-medium block mt-0.5">
              No pagamento você pode ajustar o valor real pago.
            </span>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Dia do Vencimento *
            </label>
            <input
              v-model.number="dueDay"
              type="number"
              min="1"
              max="31"
              required
              placeholder="10"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <span class="text-[10px] text-slate-400 font-medium block mt-0.5">
              Dia do mês (1 a 31).
            </span>
          </div>
        </div>

        <!-- Conta Bancária Preferida -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Conta Bancária Padrão (Opcional)
          </label>
          <select
            v-model="selectedBankAccountId"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
          >
            <option :value="null">Nenhuma / Escolher no momento do pagamento</option>
            <option
              v-for="acc in store.bankAccounts"
              :key="acc.id"
              :value="acc.id"
            >
              🏦 {{ acc.name }} (Saldo: {{ formatCurrency(acc.current_balance) }})
            </option>
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
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {{ isSubmitting ? 'Salvando...' : 'Salvar Despesa Fixa' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
