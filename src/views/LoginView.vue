<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, Mail, Eye, EyeOff, AlertCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const email = ref('alex@flux.app')
const password = ref('password')
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const handleLogin = async () => {
  errorMessage.value = null
  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha o e-mail e a senha para continuar.'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.login(email.value, password.value)
    await dashboardStore.fetchDashboardData()
    router.push('/')
  } catch (err: any) {
    errorMessage.value =
      err?.message ||
      err?.data?.message ||
      'Credenciais inválidas. Verifique seu e-mail e senha.'
  } finally {
    isSubmitting.value = false
  }
}

const fillDemoCredentials = async () => {
  email.value = 'alex@flux.app'
  password.value = 'password'
  await handleLogin()
}
</script>

<template>
  <div class="w-full max-w-md mx-auto py-8">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl shadow-lg shadow-indigo-600/25 mb-4">
        F
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Acesse sua conta
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
        Gerenciador financeiro inteligente para você e sua família.
      </p>
    </div>

    <!-- Login Card -->
    <div class="rounded-[28px] bg-white p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-900/5">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mb-5 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <span class="flex-1">{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email Input -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            E-mail
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail class="w-4 h-4" />
            </div>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="seu@email.com"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Password Input -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Senha
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-4 h-4" />
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full mt-2 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span v-else class="flex items-center gap-2">
            Entrar na Conta
            <ArrowRight class="w-4 h-4" />
          </span>
        </button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-100"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-white px-3 text-slate-400 font-bold tracking-wider">ou</span>
        </div>
      </div>

      <!-- Quick Demo Login Button -->
      <button
        type="button"
        @click="fillDemoCredentials"
        :disabled="isSubmitting"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 active:bg-indigo-100/80 text-indigo-700 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
      >
        <Sparkles class="w-4 h-4 text-indigo-600" />
        <span>Entrar com Conta Demo (Alex)</span>
      </button>
    </div>

    <!-- Security footnote -->
    <p class="text-center text-xs text-slate-400 mt-6 font-medium">
      Conexão segura criptografada com proteção de dados.
    </p>
  </div>
</template>
