<script setup lang="ts">
import { ref } from 'vue'
import { X, LogIn, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

const handleSubmit = async () => {
  errorMessage.value = null
  isSubmitting.value = true

  try {
    if (mode.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      const response = await authStore.login(email.value, password.value)
    }

    await dashboardStore.fetchDashboardData()
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha na autenticação'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-900">
          {{ mode === 'login' ? 'Acessar Conta BMO' : 'Criar Nova Conta' }}
        </h3>
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="errorMessage" class="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <div v-if="mode === 'register'">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Nome Completo
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Nome Completo"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            E-mail
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="seu@email.com"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Senha
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 rounded-2xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
        >
          {{ isSubmitting ? 'Conectando...' : (mode === 'login' ? 'Entrar' : 'Registrar') }}
        </button>
      </form>
    </div>
  </div>
</template>
