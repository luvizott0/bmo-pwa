<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Boxes,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Home,
} from 'lucide-vue-next'
import { inventoryService } from '@/services/inventoryService'
import type { StockInviteDetails } from '@/types/inventory'

const route = useRoute()
const router = useRouter()

const token = ref<string>((route.params.token as string) || '')
const isLoading = ref(true)
const isAccepting = ref(false)
const inviteDetails = ref<StockInviteDetails | null>(null)
const errorMessage = ref<string | null>(null)
const isSuccess = ref(false)
const successMessage = ref<string | null>(null)

const loadInviteDetails = async () => {
  if (!token.value) {
    errorMessage.value = 'Token de convite não informado.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const data = await inventoryService.getStockInviteDetails(token.value)
    inviteDetails.value = data
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      'Este convite de estoque é de uso único e já expirou ou foi utilizado.'
  } finally {
    isLoading.value = false
  }
}

const handleAcceptInvite = async () => {
  if (!token.value) return

  isAccepting.value = true
  errorMessage.value = null

  try {
    const res = await inventoryService.acceptStockInvite(token.value)
    isSuccess.value = true
    successMessage.value = res.message || 'Estoque conectado com sucesso!'
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      'Não foi possível aceitar o convite. Verifique se o link ainda é válido.'
  } finally {
    isAccepting.value = false
  }
}

onMounted(() => {
  loadInviteDetails()
})
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center py-10 px-4 sm:px-6">
    <div class="w-full max-w-lg bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-900/5 p-6 sm:p-9 text-center space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-12 space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
          <Boxes class="w-8 h-8" />
        </div>
        <p class="text-sm font-semibold text-slate-500">Validando convite de compartilhamento...</p>
      </div>

      <!-- Success State -->
      <div v-else-if="isSuccess" class="py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-200">
          <PackageCheck class="w-10 h-10 stroke-[2.2]" />
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">
            Estoque Compartilhado!
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
            {{ successMessage }}
          </p>
        </div>

        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            @click="router.push('/inventory')"
            class="w-full sm:w-auto py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ver Estoque Compartilhado</span>
            <ArrowRight class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="router.push('/')"
            class="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition cursor-pointer"
          >
            Ir ao Dashboard
          </button>
        </div>
      </div>

      <!-- Error / Invalid Invite State -->
      <div v-else-if="errorMessage || !inviteDetails?.is_valid" class="py-6 space-y-5">
        <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle class="w-8 h-8 stroke-[2.2]" />
        </div>

        <div class="space-y-2">
          <h2 class="text-xl font-bold text-slate-900">
            Convite Inválido ou Expirado
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 font-medium">
            {{ errorMessage || 'Este convite de estoque é de uso único e já foi utilizado ou ultrapassou a validade.' }}
          </p>
        </div>

        <div class="pt-4">
          <button
            type="button"
            @click="router.push('/')"
            class="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer inline-flex items-center gap-2"
          >
            <Home class="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      </div>

      <!-- Valid Invite Confirmation State -->
      <div v-else class="space-y-6 animate-in fade-in duration-200">
        <!-- Icon -->
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/25">
          <Boxes class="w-8 h-8 stroke-[2.2]" />
        </div>

        <!-- Header -->
        <div class="space-y-1.5">
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700">
            <ShieldCheck class="w-3.5 h-3.5" />
            Convite de Uso Único
          </span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
            Compartilhar Estoque
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 font-medium">
            <strong class="text-slate-800">{{ inviteDetails?.inviter_name }}</strong> convidou você para compartilhar o estoque e a despensa da casa.
          </p>
        </div>

        <!-- Card summary info -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
          <div class="flex items-center justify-between text-slate-600 font-medium">
            <span>Espaço de Origem:</span>
            <strong class="text-slate-800">{{ inviteDetails?.workspace_name }}</strong>
          </div>
          <div class="flex items-center justify-between text-slate-600 font-medium">
            <span>Itens no estoque:</span>
            <strong class="text-indigo-600 font-bold">{{ inviteDetails?.items_count }} itens</strong>
          </div>
          <div class="border-t border-slate-200/60 pt-2 text-[11px] text-slate-400 font-medium">
            ✓ Ao aceitar, vocês gerenciam os mesmos produtos, compras e consumos em tempo real.<br />
            ✓ Se você já possuía itens cadastrados no seu estoque, eles serão mesclados com segurança.
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3 pt-2">
          <button
            type="button"
            @click="handleAcceptInvite"
            :disabled="isAccepting"
            class="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isAccepting" class="w-4 h-4 animate-spin" />
            <span v-else class="flex items-center gap-2">
              Aceitar Compartilhamento de Estoque
              <ArrowRight class="w-4 h-4" />
            </span>
          </button>

          <button
            type="button"
            @click="router.push('/')"
            class="w-full py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            Recusar e Voltar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
