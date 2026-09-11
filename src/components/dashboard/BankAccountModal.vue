<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Landmark, Users } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import type { BankAccount } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
  accountToEdit?: BankAccount | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!props.accountToEdit)

const name = ref('')
const accountType = ref<'checking' | 'savings' | 'investment' | 'cash' | 'other'>('checking')
const balance = ref<number | null>(null)
const isShared = ref(true)
const userId = ref<number | null>(null)

const colors: string[] = ['#2563eb', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#0f172a', '#14b8a6']
const colorHex = ref<string>(colors[0] ?? '#2563eb')

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
  if (props.accountToEdit) {
    name.value = props.accountToEdit.name
    accountType.value = props.accountToEdit.type || 'checking'
    balance.value = Number(props.accountToEdit.current_balance)
    colorHex.value = props.accountToEdit.color_hex || colors[0] || '#2563eb'
    isShared.value = props.accountToEdit.is_shared !== undefined ? !!props.accountToEdit.is_shared : true
    userId.value = props.accountToEdit.user_id ?? props.accountToEdit.user?.id ?? authStore.user?.id ?? null
  } else {
    name.value = ''
    accountType.value = 'checking'
    balance.value = null
    colorHex.value = colors[0] ?? '#2563eb'
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
  () => props.accountToEdit,
  () => {
    if (props.isOpen) {
      populateForm()
    }
  }
)

const handleSubmit = async () => {
  if (!name.value.trim() || balance.value === null) return

  isSubmitting.value = true
  try {
    if (isEditing.value && props.accountToEdit) {
      await store.updateAccount(props.accountToEdit.id, {
        name: name.value.trim(),
        bank_name: name.value.trim(),
        type: accountType.value,
        current_balance: Number(balance.value),
        color_hex: colorHex.value,
        is_shared: isShared.value,
        user_id: userId.value,
      })
    } else {
      await store.addAccount({
        name: name.value.trim(),
        bank_name: name.value.trim(),
        type: accountType.value,
        current_balance: Number(balance.value),
        color_hex: colorHex.value,
        is_active: true,
        badge: 'DEBIT',
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
          <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Landmark class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {{ isEditing ? 'Editar Conta Bancária' : 'Nova Conta Bancária' }}
            </h3>
            <p class="text-xs text-slate-400">
              {{ isEditing ? 'Atualize os dados da sua conta ou titularidade' : 'Cadastre sua conta ou carteira' }}
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

        <!-- Titular da Conta (Owner) -->
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Titular da Conta</span>
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

        <!-- Conta Compartilhada Toggle -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-900">Conta Compartilhada</p>
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
          <span v-else>{{ isEditing ? 'Salvar Alterações' : 'Salvar Conta Bancária' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
