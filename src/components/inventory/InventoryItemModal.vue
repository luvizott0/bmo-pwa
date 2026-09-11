<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  X,
  Package,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
  Plus,
  Layers,
} from 'lucide-vue-next'
import { inventoryService } from '@/services/inventoryService'
import type { InventoryItem, StockCategory } from '@/types/inventory'

const props = defineProps<{
  isOpen: boolean
  item?: InventoryItem | null
  categories: StockCategory[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const isEditing = computed(() => !!props.item)

const name = ref('')
const brand = ref('')
const selectedCategoryId = ref<number | null>(null)
const quantity = ref<number>(1)
const unit = ref<string>('un')
const minQuantity = ref<number | null>(1)
const lastPrice = ref<number | null>(null)
const durationDays = ref<number | null>(30)
const expirationDate = ref<string>('')
const notes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const unitOptions = [
  { label: 'Unidade (un)', value: 'un' },
  { label: 'Pacote (pct)', value: 'pct' },
  { label: 'Quilo (kg)', value: 'kg' },
  { label: 'Grama (g)', value: 'g' },
  { label: 'Litro (L)', value: 'L' },
  { label: 'Mililitro (ml)', value: 'ml' },
  { label: 'Caixa (cx)', value: 'cx' },
  { label: 'Rolo (rolo)', value: 'rolo' },
]

const durationPresets = [
  { label: '15 dias', days: 15 },
  { label: '1 mês (~30d)', days: 30 },
  { label: '45 dias', days: 45 },
  { label: '2 meses (~60d)', days: 60 },
  { label: '3 meses (~90d)', days: 90 },
]

function resetForm() {
  if (props.item) {
    name.value = props.item.name || ''
    brand.value = props.item.brand || ''
    selectedCategoryId.value = props.item.stock_category_id || null
    quantity.value = Number(props.item.quantity ?? 1)
    unit.value = props.item.unit || 'un'
    minQuantity.value = props.item.min_quantity !== null ? Number(props.item.min_quantity) : null
    lastPrice.value = props.item.last_price !== null ? Number(props.item.last_price) : null
    durationDays.value = props.item.duration_days ? Number(props.item.duration_days) : null
    expirationDate.value = props.item.expiration_date || ''
    notes.value = props.item.notes || ''
  } else {
    name.value = ''
    brand.value = ''
    selectedCategoryId.value = props.categories.length > 0 ? (props.categories[0]?.id ?? null) : null
    quantity.value = 1
    unit.value = 'un'
    minQuantity.value = 1
    lastPrice.value = null
    durationDays.value = 30
    expirationDate.value = ''
    notes.value = ''
  }
  errorMessage.value = null
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

const handleSubmit = async () => {
  if (!name.value.trim()) {
    errorMessage.value = 'Por favor, informe o nome do item.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload: Partial<InventoryItem> = {
      name: name.value.trim(),
      brand: brand.value.trim() || null,
      stock_category_id: selectedCategoryId.value || null,
      quantity: Number(quantity.value ?? 0),
      unit: unit.value || 'un',
      min_quantity: minQuantity.value !== null && minQuantity.value !== undefined ? Number(minQuantity.value) : null,
      last_price: lastPrice.value !== null && lastPrice.value !== undefined ? Number(lastPrice.value) : null,
      duration_days: durationDays.value !== null && durationDays.value !== undefined ? Number(durationDays.value) : null,
      expiration_date: expirationDate.value || null,
      notes: notes.value.trim() || null,
      is_regular_expense: true,
    }

    if (isEditing.value && props.item) {
      await inventoryService.updateItem(props.item.id, payload)
    } else {
      await inventoryService.createItem(payload)
    }

    emit('saved')
    emit('close')
  } catch (err: any) {
    console.error('Erro ao salvar item no estoque:', err)
    errorMessage.value = err?.message || 'Falha ao salvar o item. Verifique os dados inseridos.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-xl max-h-[calc(100dvh-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 leading-tight">
              {{ isEditing ? 'Editar Item do Estoque' : 'Cadastrar Item no Estoque' }}
            </h3>
            <p class="text-xs text-slate-400 font-medium">
              Supermercado, higiene, farmácia ou limpeza da casa
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <!-- Scrollable Form Body -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
          <!-- Error message -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2.5"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Nome & Marca -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nome do Item *
            </label>
            <input
              v-model="name"
              type="text"
              placeholder="Ex: Shampoo Anticaspa, Arroz 1kg"
              required
              class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Marca / Fabricante
            </label>
            <input
              v-model="brand"
              type="text"
              placeholder="Ex: Head & Shoulders, Ypê"
              class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <!-- Categoria com cores -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Categoria
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              @click="selectedCategoryId = cat.id"
              :style="{
                borderColor: selectedCategoryId === cat.id ? cat.color_hex : 'transparent',
                backgroundColor: selectedCategoryId === cat.id ? `${cat.color_hex}15` : '#f8fafc',
                color: selectedCategoryId === cat.id ? cat.color_hex : '#475569'
              }"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer',
                selectedCategoryId === cat.id ? 'shadow-2xs font-extrabold' : 'hover:bg-slate-100 border-slate-200'
              ]"
            >
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: cat.color_hex }"
              />
              <span>{{ cat.name }}</span>
            </button>
          </div>
        </div>

        <!-- Quantidade, Unidade & Estoque Mínimo -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Quantidade Atual
            </label>
            <input
              v-model="quantity"
              type="number"
              step="any"
              min="0"
              placeholder="1"
              class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Unidade
            </label>
            <select
              v-model="unit"
              class="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option v-for="u in unitOptions" :key="u.value" :value="u.value">
                {{ u.label }}
              </option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Alerta Mínimo
            </label>
            <input
              v-model="minQuantity"
              type="number"
              step="any"
              min="0"
              placeholder="1"
              class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <!-- Último Valor Pago & Duração Estimada -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Último Valor Pago (R$)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                v-model="lastPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <p class="text-[11px] text-slate-400 font-medium">
              Valor unitário na última compra
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Duração Estimada (dias)
            </label>
            <div class="relative">
              <Clock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="durationDays"
                type="number"
                min="1"
                placeholder="Ex: 30"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <!-- Duration quick presets -->
            <div class="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
              <button
                v-for="p in durationPresets"
                :key="p.days"
                type="button"
                @click="durationDays = p.days"
                class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0 cursor-pointer"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Data de Validade & Observações -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Data de Validade (opcional)
            </label>
            <div class="relative">
              <Calendar class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="expirationDate"
                type="date"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Observações
            </label>
            <input
              v-model="notes"
              type="text"
              placeholder="Ex: Frasco 400ml, Comprar no Atacadão"
              class="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      <!-- Actions (Pinned Footer) -->
      <div class="p-4 sm:p-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/70">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer inline-flex items-center gap-2"
        >
          <span v-if="isSubmitting">Salvando...</span>
          <span v-else>{{ isEditing ? 'Atualizar Item' : 'Cadastrar Item' }}</span>
        </button>
      </div>
    </form>
  </div>
  </div>
</template>
