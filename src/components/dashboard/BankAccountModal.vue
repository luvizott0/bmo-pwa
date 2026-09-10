<script setup lang="ts">
import { ref } from 'vue'
import { X, Landmark } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()

const name = ref('')
const accountType = ref<'checking' | 'savings' | 'investment' | 'cash' | 'other'>('checking')
const balance = ref<number | null>(null)
const dailyLimit = ref<number | null>(null)

const colors: string[] = ['#2563eb', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#0f172a', '#14b8a6']
const colorHex = ref<string>(colors[0] ?? '#2563eb')

const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (!name.value.trim() || balance.value === null) return

  isSubmitting.value = true
  try {
    await store.addAccount({
      name: name.value.trim(),
      bank_name: name.value.trim(),
      type: accountType.value,
      current_balance: Number(balance.value),
      daily_limit: dailyLimit.value ? Number(dailyLimit.value) : 5000,
      color_hex: colorHex.value,
      is_active: true,
      badge: 'DEBIT',
    })

    // Reset & close
    name.value = ''
    accountType.value = 'checking'
    balance.value = null
    dailyLimit.value = null
    emit('close')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Landmark class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Nova Conta Bancária
            </h3>
            <p class="text-xs text-slate-400">Cadastre sua conta ou carteira</p>
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- Account Name -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Nome da Conta
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Ex: Nubank, Banco do Brasil, Itaú"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <!-- Account Type & Current Balance -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tipo de Conta
            </label>
            <select
              v-model="accountType"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimentos</option>
              <option value="cash">Dinheiro / Carteira</option>
              <option value="other">Outra</option>
            </select>
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
              placeholder="0,00"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Daily Limit (Optional) -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Limite Diário de Movimentação (R$)
          </label>
          <input
            v-model="dailyLimit"
            type="number"
            step="0.01"
            placeholder="Padrão: 5.000,00"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <!-- Identification Color -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Cor de Identificação
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
          <span v-if="isSubmitting">Salvando Conta...</span>
          <span v-else>Salvar Conta Bancária</span>
        </button>
      </form>
    </div>
  </div>
</template>
