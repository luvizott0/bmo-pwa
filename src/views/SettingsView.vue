<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  Landmark,
  Check,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const isSettingPrimary = ref<number | null>(null)
const primarySuccessMessage = ref<string | null>(null)

onMounted(async () => {
  if (dashboardStore.bankAccounts.length === 0) {
    await dashboardStore.fetchDashboardData()
  }
})

const handleSetPrimary = async (accountId: number) => {
  isSettingPrimary.value = accountId
  primarySuccessMessage.value = null
  try {
    await dashboardStore.setPrimaryBankAccount(accountId)
    primarySuccessMessage.value = 'Conta bancária principal atualizada com sucesso!'
    setTimeout(() => {
      primarySuccessMessage.value = null
    }, 4000)
  } catch (err: any) {
    console.error('Erro ao definir conta principal:', err)
  } finally {
    isSettingPrimary.value = null
  }
}

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

    <!-- Primary Bank Account Section -->
    <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Landmark class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Conta Bancária Principal
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
              Esta conta receberá os valores de rateios de assinaturas em família e transferências padrão.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="router.push('/accounts')"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer hidden sm:inline-block"
        >
          Gerenciar Contas →
        </button>
      </div>

      <!-- Success message for primary account -->
      <div
        v-if="primarySuccessMessage"
        class="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{{ primarySuccessMessage }}</span>
      </div>

      <!-- Accounts Grid / List -->
      <div v-if="dashboardStore.bankAccounts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          v-for="acc in dashboardStore.bankAccounts"
          :key="acc.id"
          @click="!acc.is_primary && handleSetPrimary(acc.id)"
          :class="[
            'p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3',
            acc.is_primary
              ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer'
          ]"
        >
          <!-- Left: Color badge & Account details -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-xs"
              :style="{ backgroundColor: acc.color_hex || '#2563eb' }"
            >
              <Landmark class="w-5 h-5" />
            </div>

            <div class="min-w-0 truncate">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold text-slate-900 truncate">
                  {{ acc.name }}
                </span>
                <span
                  v-if="acc.is_primary"
                  class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shrink-0 shadow-2xs"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                  Principal
                </span>
              </div>
              <p class="text-xs text-slate-400 font-medium truncate">
                {{ acc.bank_name }} • Saldo: <strong class="text-slate-700">{{ formatCurrency(acc.current_balance) }}</strong>
              </p>
            </div>
          </div>

          <!-- Right: Button / Status -->
          <div class="shrink-0">
            <span
              v-if="acc.is_primary"
              class="text-xs font-bold text-blue-600 bg-blue-100/70 px-3 py-1.5 rounded-xl block text-center"
            >
              Padrão
            </span>
            <button
              v-else
              type="button"
              @click.stop="handleSetPrimary(acc.id)"
              :disabled="isSettingPrimary === acc.id"
              class="text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200 transition cursor-pointer disabled:opacity-50"
            >
              {{ isSettingPrimary === acc.id ? 'Definindo...' : 'Tornar Principal' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state if no bank accounts -->
      <div
        v-else
        class="text-center py-6 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400"
      >
        <p class="text-xs font-semibold">Nenhuma conta bancária cadastrada no seu espaço.</p>
        <button
          type="button"
          @click="router.push('/accounts')"
          class="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          + Cadastrar Conta Bancária
        </button>
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
