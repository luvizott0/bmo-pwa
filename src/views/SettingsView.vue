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
  Boxes,
  Copy,
  Users,
  Share2,
  Unlink,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { inventoryService } from '@/services/inventoryService'
import type { StockShareStatus } from '@/types/inventory'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const isSettingPrimary = ref<number | null>(null)
const primarySuccessMessage = ref<string | null>(null)

// Stock Sharing State
const stockShareStatus = ref<StockShareStatus | null>(null)
const isLoadingStockStatus = ref(false)
const isGeneratingInvite = ref(false)
const isRevokingInvite = ref(false)
const isLeavingStock = ref(false)
const showLeaveConfirm = ref(false)
const stockCopied = ref(false)
const stockErrorMessage = ref<string | null>(null)
const stockSuccessMessage = ref<string | null>(null)

const loadStockShareStatus = async () => {
  isLoadingStockStatus.value = true
  try {
    const data = await inventoryService.getStockShareStatus()
    stockShareStatus.value = data
  } catch (err: any) {
    console.error('Erro ao carregar status do compartilhamento de estoque:', err)
  } finally {
    isLoadingStockStatus.value = false
  }
}

const handleGenerateInvite = async () => {
  isGeneratingInvite.value = true
  stockErrorMessage.value = null
  stockSuccessMessage.value = null
  try {
    await inventoryService.createStockShareInvite()
    await loadStockShareStatus()
    stockSuccessMessage.value = 'Link de uso único gerado com sucesso! Copie e envie para a outra pessoa.'
    setTimeout(() => {
      stockSuccessMessage.value = null
    }, 5000)
  } catch (err: any) {
    stockErrorMessage.value = err?.data?.message || err?.message || 'Erro ao gerar link de compartilhamento.'
  } finally {
    isGeneratingInvite.value = false
  }
}

const handleRevokeInvite = async () => {
  isRevokingInvite.value = true
  stockErrorMessage.value = null
  stockSuccessMessage.value = null
  try {
    await inventoryService.revokeStockShareInvite()
    await loadStockShareStatus()
    stockSuccessMessage.value = 'Link de convite revogado.'
    setTimeout(() => {
      stockSuccessMessage.value = null
    }, 4000)
  } catch (err: any) {
    stockErrorMessage.value = err?.data?.message || err?.message || 'Erro ao revogar convite.'
  } finally {
    isRevokingInvite.value = false
  }
}

const handleCopyLink = async () => {
  if (!stockShareStatus.value?.pending_invitation?.token) return
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullUrl = `${origin}/invites/stock/${stockShareStatus.value.pending_invitation.token}`

  try {
    await navigator.clipboard.writeText(fullUrl)
    stockCopied.value = true
    setTimeout(() => {
      stockCopied.value = false
    }, 3000)
  } catch {
    const input = document.createElement('input')
    input.value = fullUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    stockCopied.value = true
    setTimeout(() => {
      stockCopied.value = false
    }, 3000)
  }
}

const handleLeaveStockShare = async (memberUserId?: number) => {
  isLeavingStock.value = true
  stockErrorMessage.value = null
  stockSuccessMessage.value = null
  try {
    const res = await inventoryService.leaveStockShare(memberUserId)
    showLeaveConfirm.value = false
    await loadStockShareStatus()
    stockSuccessMessage.value = res.message || 'Desconectado do estoque compartilhado.'
    setTimeout(() => {
      stockSuccessMessage.value = null
    }, 4000)
  } catch (err: any) {
    stockErrorMessage.value = err?.data?.message || err?.message || 'Erro ao desconectar do estoque compartilhado.'
  } finally {
    isLeavingStock.value = false
  }
}

const getFullInviteUrl = (token: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/invites/stock/${token}`
}

onMounted(async () => {
  await Promise.all([
    dashboardStore.bankAccounts.length === 0 ? dashboardStore.fetchDashboardData() : Promise.resolve(),
    loadStockShareStatus(),
  ])
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

    <!-- Stock Sharing Section -->
    <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Boxes class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Compartilhamento de Estoque
              </h3>
              <span
                v-if="stockShareStatus?.is_shared"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700"
              >
                <Check class="w-3 h-3 stroke-[3]" />
                Compartilhado
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600"
              >
                Individual
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
              Compartilhe a despensa e o controle de itens da casa com outro usuário através de link de uso único.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="router.push('/inventory')"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer hidden sm:inline-block"
        >
          Acessar Estoque →
        </button>
      </div>

      <!-- Success message banner -->
      <div
        v-if="stockSuccessMessage"
        class="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{{ stockSuccessMessage }}</span>
      </div>

      <!-- Error message banner -->
      <div
        v-if="stockErrorMessage"
        class="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold animate-in fade-in duration-200"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0" />
        <span>{{ stockErrorMessage }}</span>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingStockStatus" class="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs font-semibold">
        <RefreshCw class="w-4 h-4 animate-spin text-indigo-600" />
        <span>Carregando informações de compartilhamento...</span>
      </div>

      <div v-else class="space-y-5">
        <!-- Connected Members List (if shared) -->
        <div v-if="stockShareStatus?.is_shared" class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span class="flex items-center gap-1.5">
              <Users class="w-4 h-4 text-slate-500" />
              Usuários com acesso ao mesmo estoque
            </span>
            <span class="text-slate-400 font-medium lowercase">
              {{ stockShareStatus.members.length }} conectado(s)
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div
              v-for="member in stockShareStatus.members"
              :key="member.id"
              class="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                  {{ member.name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 truncate">
                  <p class="text-xs font-bold text-slate-900 truncate">
                    {{ member.name }}
                    <span v-if="member.id === authStore.user?.id" class="text-slate-400 font-normal">(você)</span>
                  </p>
                  <p class="text-[11px] text-slate-400 truncate">{{ member.email }}</p>
                </div>
              </div>

              <span
                v-if="member.is_owner"
                class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/50 shrink-0"
              >
                Proprietário
              </span>
              <button
                v-else-if="stockShareStatus.is_owner"
                type="button"
                @click="handleLeaveStockShare(member.id)"
                :disabled="isLeavingStock"
                class="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        <!-- Pending Invitation Card (if generated) -->
        <div
          v-if="stockShareStatus?.pending_invitation"
          class="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white shadow-2xs">
                Link Ativo
              </span>
              <span class="text-xs font-bold text-purple-950">
                Link de Compartilhamento de Uso Único
              </span>
            </div>
            <span class="text-[11px] font-semibold text-purple-700">
              Válido por 48 horas ou até ser aceito
            </span>
          </div>

          <!-- Link input and copy button -->
          <div class="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              readonly
              :value="getFullInviteUrl(stockShareStatus.pending_invitation.token)"
              class="w-full px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="handleCopyLink"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition shadow-sm shadow-purple-600/20 cursor-pointer"
              >
                <Check v-if="stockCopied" class="w-3.5 h-3.5 stroke-[3]" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ stockCopied ? 'Copiado!' : 'Copiar Link' }}</span>
              </button>
              <button
                type="button"
                @click="handleRevokeInvite"
                :disabled="isRevokingInvite"
                class="px-3 py-2 rounded-xl border border-purple-200 hover:bg-purple-100/60 text-purple-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {{ isRevokingInvite ? 'Cancelando...' : 'Cancelar Link' }}
              </button>
            </div>
          </div>
          <p class="text-[11px] text-purple-700 font-medium">
            💡 Envie este link para outra pessoa. Assim que ela acessar e aceitar, vocês passarão a ter o mesmo estoque automaticamente.
          </p>
        </div>

        <!-- Action Buttons depending on state -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <p v-if="!stockShareStatus?.is_shared && !stockShareStatus?.pending_invitation" class="text-xs text-slate-400 font-medium">
              Ao gerar o link, ele poderá ser usado apenas uma vez para vincular outro usuário ao seu estoque.
            </p>
            <p v-else-if="stockShareStatus?.is_shared" class="text-xs text-slate-400 font-medium">
              Qualquer item adicionado, atualizado ou consumido no estoque é refletido em tempo real para todos os membros conectados.
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Disconnect button if connected as member -->
            <template v-if="stockShareStatus?.is_shared && !stockShareStatus?.is_owner">
              <button
                v-if="!showLeaveConfirm"
                type="button"
                @click="showLeaveConfirm = true"
                class="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Unlink class="w-3.5 h-3.5" />
                <span>Desconectar Estoque</span>
              </button>
              <template v-else>
                <button
                  type="button"
                  @click="showLeaveConfirm = false"
                  class="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="handleLeaveStockShare()"
                  :disabled="isLeavingStock"
                  class="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {{ isLeavingStock ? 'Saindo...' : 'Confirmar Saída' }}
                </button>
              </template>
            </template>

            <!-- Generate Invite Button if owner -->
            <button
              v-if="stockShareStatus?.is_owner && !stockShareStatus?.pending_invitation"
              type="button"
              @click="handleGenerateInvite"
              :disabled="isGeneratingInvite"
              class="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-600/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw v-if="isGeneratingInvite" class="w-4 h-4 animate-spin" />
              <Share2 v-else class="w-4 h-4" />
              <span>{{ stockShareStatus?.is_shared ? 'Convidar Mais Alguém' : 'Gerar Link de Compartilhamento' }}</span>
            </button>
          </div>
        </div>
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
