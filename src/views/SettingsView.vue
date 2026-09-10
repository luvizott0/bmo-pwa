<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Lock,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// Change Password form state
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirmation = ref('')
const isSubmittingPassword = ref(false)
const passwordSuccessMessage = ref<string | null>(null)
const passwordErrorMessage = ref<string | null>(null)

// Logout state
const isLoggingOut = ref(false)
const showLogoutConfirm = ref(false)

const handlePasswordChange = async () => {
  passwordSuccessMessage.value = null
  passwordErrorMessage.value = null

  if (!currentPassword.value) {
    passwordErrorMessage.value = 'Por favor, informe a senha atual.'
    return
  }

  if (newPassword.value.length < 8) {
    passwordErrorMessage.value = 'A nova senha deve possuir no mínimo 8 caracteres.'
    return
  }

  if (newPassword.value !== newPasswordConfirmation.value) {
    passwordErrorMessage.value = 'A confirmação da nova senha não confere.'
    return
  }

  isSubmittingPassword.value = true

  try {
    const response: any = await authStore.changePassword({
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: newPasswordConfirmation.value,
    })

    passwordSuccessMessage.value = response?.message || 'Senha atualizada com sucesso!'
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirmation.value = ''
  } catch (err: any) {
    passwordErrorMessage.value =
      err?.data?.message ||
      err?.data?.errors?.current_password?.[0] ||
      err?.data?.errors?.password?.[0] ||
      err?.message ||
      'Falha ao atualizar a senha. Verifique se a senha atual está correta.'
  } finally {
    isSubmittingPassword.value = false
  }
}

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    dashboardStore.resetState()
    router.push('/login')
  } catch (err) {
    console.warn('Erro ao sair da conta', err)
    dashboardStore.resetState()
    router.push('/login')
  } finally {
    isLoggingOut.value = false
    showLogoutConfirm.value = false
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 max-w-4xl pb-20 lg:pb-10">
    <!-- Header -->
    <header>
      <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
        Configurações da Conta
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
        Gerencie os dados da sua conta, segurança e preferências de acesso.
      </p>
    </header>

    <!-- User Profile Summary Card -->
    <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex items-center gap-4">
        <!-- Avatar Circle -->
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white text-xl font-extrabold shadow-sm shadow-indigo-200 shrink-0">
          {{ (authStore.user?.name || dashboardStore.summary.user_name || 'U').charAt(0).toUpperCase() }}
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900">
              {{ authStore.user?.name || dashboardStore.summary.user_name || 'Usuário' }}
            </h2>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
              <ShieldCheck class="w-3.5 h-3.5" />
              Ativo
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            {{ authStore.user?.email || 'email@exemplo.com' }}
          </p>
        </div>
      </div>

      <!-- Quick status / workspace -->
      <div class="flex items-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 text-xs text-slate-500 font-semibold">
        <span class="text-slate-400">Espaço Ativo:</span>
        <span class="bg-slate-100 text-slate-800 px-3 py-1 rounded-xl font-bold">
          {{ authStore.workspaces?.[0]?.name || 'Meu Espaço Pessoal' }}
        </span>
      </div>
    </div>

    <!-- Security & Password Change Section -->
    <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <KeyRound class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Alterar Senha
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Informe sua senha atual e escolha uma nova senha com no mínimo 8 caracteres.
          </p>
        </div>
      </div>

      <!-- Success Banner -->
      <div
        v-if="passwordSuccessMessage"
        class="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{{ passwordSuccessMessage }}</span>
      </div>

      <!-- Error Banner -->
      <div
        v-if="passwordErrorMessage"
        class="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0" />
        <span>{{ passwordErrorMessage }}</span>
      </div>

      <form @submit.prevent="handlePasswordChange" class="space-y-4 max-w-xl">
        <!-- Current Password -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Senha Atual
          </label>
          <div class="relative">
            <input
              v-model="currentPassword"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- New Password -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Nova Senha
          </label>
          <div class="relative">
            <input
              v-model="newPassword"
              type="password"
              required
              placeholder="•••••••• (mínimo 8 caracteres)"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <!-- Confirm New Password -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Confirmar Nova Senha
          </label>
          <div class="relative">
            <input
              v-model="newPasswordConfirmation"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmittingPassword"
          class="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw v-if="isSubmittingPassword" class="w-4 h-4 animate-spin" />
          <span>{{ isSubmittingPassword ? 'Atualizando...' : 'Salvar Nova Senha' }}</span>
        </button>
      </form>
    </div>

    <!-- Danger Zone / Logout Section -->
    <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <LogOut class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Encerrar Sessão
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Desconectar sua conta neste dispositivo e limpar tokens locais de autenticação.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="!showLogoutConfirm"
          type="button"
          @click="showLogoutConfirm = true"
          class="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 active:bg-rose-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center"
        >
          Sair da Conta
        </button>

        <!-- Confirmation state -->
        <template v-else>
          <button
            type="button"
            @click="showLogoutConfirm = false"
            class="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            {{ isLoggingOut ? 'Saindo...' : 'Confirmar Saída' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
