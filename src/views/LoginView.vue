<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Lock, Mail, Eye, EyeOff, AlertCircle, RefreshCw, User, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { financialService } from '@/services/financialService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const isRegisterMode = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const handleSubmit = async () => {
  errorMessage.value = null
  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha todos os campos obrigatórios.'
    return
  }

  if (isRegisterMode.value) {
    if (!name.value) {
      errorMessage.value = 'Informe o seu nome completo.'
      return
    }
    if (password.value !== passwordConfirmation.value) {
      errorMessage.value = 'A confirmação de senha não coincide.'
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isRegisterMode.value) {
      const response: any = await financialService.register({
        name: name.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      })
      authStore.setAuth(response.token, response.user, response.workspaces)
    } else {
      await authStore.login(email.value, password.value)
    }

    try {
      await dashboardStore.fetchDashboardData()
    } catch {
      // Ignore dashboard fetch error on brand new accounts
    }

    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      (err?.data?.errors ? Object.values(err.data.errors).flat().join(' ') : null) ||
      err?.message ||
      'Falha na autenticação. Verifique os dados informados.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto py-8">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl shadow-lg shadow-indigo-600/25 mb-4">
        B
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {{ isRegisterMode ? 'Crie sua conta' : 'Acesse sua conta' }}
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
        {{ isRegisterMode ? 'Cadastre-se para gerenciar finanças e estoque compartilhado.' : 'Gerenciador inteligente para você e sua família.' }}
      </p>
    </div>

    <!-- Auth Card -->
    <div class="rounded-[28px] bg-white p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-900/5">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mb-5 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <span class="flex-1">{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name Input (Register mode only) -->
        <div v-if="isRegisterMode">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Seu Nome
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User class="w-4 h-4" />
            </div>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ex: Maria da Silva"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

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
              :placeholder="isRegisterMode ? 'Mínimo 8 caracteres' : '••••••••'"
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

        <!-- Confirm Password Input (Register mode only) -->
        <div v-if="isRegisterMode">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Confirmar Senha
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-4 h-4" />
            </div>
            <input
              v-model="passwordConfirmation"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
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
            {{ isRegisterMode ? 'Criar Conta' : 'Entrar na Conta' }}
            <ArrowRight class="w-4 h-4" />
          </span>
        </button>
      </form>

      <!-- Toggle between Login and Register -->
      <div class="mt-5 text-center pt-4 border-t border-slate-100">
        <button
          type="button"
          @click="isRegisterMode = !isRegisterMode; errorMessage = null"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
        >
          {{ isRegisterMode ? 'Já possui uma conta? Faça login aqui' : 'Ainda não tem conta? Crie sua conta grátis' }}
        </button>
      </div>
    </div>

    <!-- Security footnote -->
    <p class="text-center text-xs text-slate-400 mt-6 font-medium">
      Conexão segura criptografada com proteção de dados.
    </p>
  </div>
</template>
