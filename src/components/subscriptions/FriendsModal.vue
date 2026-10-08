<script setup lang="ts">
import { ref } from 'vue'
import {
  X,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  Phone,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { Friend } from '@/types/finance'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDashboardStore()

const isAdding = ref(false)
const editingFriendId = ref<number | null>(null)
const nameInput = ref('')
const phoneInput = ref('')
const notesInput = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

function resetForm() {
  nameInput.value = ''
  phoneInput.value = ''
  notesInput.value = ''
  isAdding.value = false
  editingFriendId.value = null
  errorMessage.value = null
}

function startAdd() {
  resetForm()
  isAdding.value = true
}

function startEdit(friend: Friend) {
  resetForm()
  editingFriendId.value = friend.id
  nameInput.value = friend.name
  phoneInput.value = friend.phone
  notesInput.value = friend.notes || ''
}

function cancelEdit() {
  resetForm()
}

// Clean and format phone for display
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

async function handleSave() {
  if (!nameInput.value.trim() || !phoneInput.value.trim()) {
    errorMessage.value = 'Preencha o nome e o telefone do amigo.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    if (editingFriendId.value) {
      await store.updateFriend(editingFriendId.value, {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        notes: notesInput.value.trim() || null,
      })
    } else {
      await store.createFriend({
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        notes: notesInput.value.trim() || null,
      })
    }
    resetForm()
  } catch (err: any) {
    console.error('Erro ao salvar amigo:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao salvar amigo.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(friendId: number) {
  const confirmed = window.confirm('Deseja realmente remover este amigo do cadastro?')
  if (!confirmed) return

  try {
    await store.deleteFriend(friendId)
  } catch (err) {
    console.error('Erro ao excluir amigo:', err)
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
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Meus Amigos
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
              Amigos fixos para rateio de assinaturas e conciliação via WhatsApp
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Explanatory Banner -->
      <div class="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-2.5">
        <MessageSquare class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p class="text-xs text-indigo-950 font-medium leading-relaxed">
          <strong class="font-bold">Match Automático:</strong> O telefone informado é utilizado pelo Robô de WhatsApp do BMO para identificar quem enviou o comprovante Pix e dar baixa na assinatura correta automaticamente.
        </p>
      </div>

      <!-- Form (Add or Edit) -->
      <div v-if="isAdding || editingFriendId" class="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {{ editingFriendId ? 'Editar Amigo' : 'Novo Amigo' }}
          </span>
          <button
            type="button"
            @click="cancelEdit"
            class="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        <div v-if="errorMessage" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {{ errorMessage }}
        </div>

        <div class="space-y-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nome *
            </label>
            <input
              v-model="nameInput"
              type="text"
              placeholder="Ex: Matheus Costa"
              class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Telefone / WhatsApp *
            </label>
            <div class="relative">
              <Phone class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="phoneInput"
                type="text"
                placeholder="(11) 98888-7777 ou 11988887777"
                class="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p class="text-[10px] text-slate-400 mt-1">
              Digite com DDD (ex: 11999998888). O bot reconhecerá mensagens deste número.
            </p>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Observação (Opcional)
            </label>
            <input
              v-model="notesInput"
              type="text"
              placeholder="Ex: Chave Pix, apelido, email..."
              class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="cancelEdit"
            class="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSave"
            :disabled="isSubmitting"
            class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {{ isSubmitting ? 'Salvando...' : (editingFriendId ? 'Atualizar Amigo' : 'Cadastrar Amigo') }}
          </button>
        </div>
      </div>

      <!-- Add Button if not adding -->
      <div v-else class="mt-4 flex justify-end">
        <button
          type="button"
          @click="startAdd"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Adicionar Novo Amigo</span>
        </button>
      </div>

      <!-- Friends List -->
      <div class="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
        <div
          v-if="store.friends.length === 0 && !isAdding"
          class="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
        >
          <Users class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h5 class="text-sm font-bold text-slate-700">
            Nenhum amigo cadastrado
          </h5>
          <p class="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Cadastre seus amigos para não ter que digitar o nome deles toda vez ao criar uma nova assinatura compartilhada.
          </p>
        </div>

        <div
          v-for="friend in store.friends"
          :key="friend.id"
          class="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition shadow-2xs"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
              {{ friend.name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <h5 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {{ friend.name }}
              </h5>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                <span>{{ formatPhone(friend.phone) }}</span>
                <span v-if="friend.notes" class="text-slate-400 truncate">• {{ friend.notes }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              @click="startEdit(friend)"
              class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Editar amigo"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="handleDelete(friend.id)"
              class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              title="Remover amigo"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
