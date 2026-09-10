<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  Package,
  Plus,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Minus,
  Layers,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Tag,
  Pencil,
  Trash2,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { inventoryService } from '@/services/inventoryService'
import { formatCurrency, formatFullDate } from '@/utils/formatters'
import type { InventoryItem, StockCategory, InventorySummary } from '@/types/inventory'
import InventoryItemModal from '@/components/inventory/InventoryItemModal.vue'
import RestockModal from '@/components/inventory/RestockModal.vue'

const items = ref<InventoryItem[]>([])
const categories = ref<StockCategory[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedStatus = ref<'all' | 'in_stock' | 'low_stock' | 'expiring_soon' | 'expired'>('all')
const sortBy = ref<string>('name_asc')

const summary = ref<InventorySummary>({
  total_items: 0,
  low_stock_count: 0,
  expired_count: 0,
  expiring_soon_count: 0,
  total_estimated_value: 0,
})

// Modals
const isItemModalOpen = ref(false)
const selectedItemForEdit = ref<InventoryItem | null>(null)

const isRestockModalOpen = ref(false)
const selectedItemForRestock = ref<InventoryItem | null>(null)

const loadCategories = async () => {
  try {
    const res = await inventoryService.getCategories()
    if (res?.data) {
      categories.value = res.data
    }
  } catch (err) {
    console.error('Erro ao carregar categorias de estoque:', err)
  }
}

const loadItems = async () => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      per_page: 50,
      sort_by: sortBy.value,
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (selectedCategoryId.value !== null) {
      params.category_id = selectedCategoryId.value
    }

    if (selectedStatus.value !== 'all') {
      params.status = selectedStatus.value
    }

    const res = await inventoryService.getItems(params)
    if (res?.data) {
      items.value = res.data
      if (res.meta?.summary) {
        summary.value = res.meta.summary
      }
    }
  } catch (err) {
    console.error('Erro ao buscar itens de estoque:', err)
  } finally {
    isLoading.value = false
  }
}

// Search debounce
let searchDebounceTimeout: any = null
watch(searchQuery, () => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    loadItems()
  }, 350)
})

watch([selectedCategoryId, selectedStatus, sortBy], () => {
  loadItems()
})

onMounted(async () => {
  await Promise.all([loadCategories(), loadItems()])
})

const handleRefresh = async () => {
  await Promise.all([loadCategories(), loadItems()])
}

// Open modal to create
const openCreateModal = () => {
  selectedItemForEdit.value = null
  isItemModalOpen.value = true
}

// Open modal to edit
const openEditModal = (item: InventoryItem) => {
  selectedItemForEdit.value = item
  isItemModalOpen.value = true
}

// Open modal to restock
const openRestockModal = (item: InventoryItem) => {
  selectedItemForRestock.value = item
  isRestockModalOpen.value = true
}

// Quick consume 1 unit
const handleConsumeOne = async (item: InventoryItem) => {
  if (item.quantity <= 0) return
  try {
    const res = await inventoryService.consumeItem(item.id, 1)
    if (res?.data) {
      const idx = items.value.findIndex(i => i.id === item.id)
      if (idx !== -1) {
        items.value[idx] = res.data
      }
      // Reload stats
      loadItems()
    }
  } catch (err) {
    console.error('Erro ao consumir unidade:', err)
  }
}

// Delete item
const handleDeleteItem = async (item: InventoryItem) => {
  const confirmed = window.confirm(`Deseja realmente excluir "${item.name}" do estoque?`)
  if (confirmed) {
    try {
      await inventoryService.deleteItem(item.id)
      await loadItems()
    } catch (err) {
      console.error('Erro ao excluir item:', err)
    }
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategoryId.value = null
  selectedStatus.value = 'all'
  sortBy.value = 'name_asc'
}

// Helper to get days remaining badge
const getExpirationBadge = (item: InventoryItem) => {
  if (!item.expiration_date || item.days_until_expiration === null || item.days_until_expiration === undefined) {
    return null
  }
  const days = item.days_until_expiration
  if (days < 0) {
    return {
      text: `Vencido há ${Math.abs(days)}d`,
      classes: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: AlertCircle,
    }
  }
  if (days === 0) {
    return {
      text: 'Vence hoje!',
      classes: 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse',
      icon: AlertCircle,
    }
  }
  if (days <= 7) {
    return {
      text: `Vence em ${days}d`,
      classes: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: AlertTriangle,
    }
  }
  if (days <= 30) {
    return {
      text: `Vence em ${days}d`,
      classes: 'bg-amber-50/70 text-amber-600 border-amber-200/60',
      icon: Clock,
    }
  }
  return {
    text: `Vence ${formatFullDate(item.expiration_date)}`,
    classes: 'bg-slate-100 text-slate-500 border-slate-200/60',
    icon: Calendar,
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-7 pb-24 lg:pb-12 max-w-[1400px]">
    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-slate-900">
            Estoque Residencial
          </h1>
          <button
            type="button"
            @click="handleRefresh"
            :title="isLoading ? 'Atualizando...' : 'Recarregar dados'"
            class="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw :class="['w-4 h-4', isLoading ? 'animate-spin text-indigo-600' : '']" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Controle itens de mercado, farmácia, limpeza e saiba a duração e custo médio de cada produto
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="openCreateModal"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Novo Item</span>
        </button>
      </div>
    </header>

    <!-- Overview KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <!-- Total Itens & Valor em Estoque -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Cadastrado
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold">
            {{ summary.total_items }} itens
          </span>
        </div>
        <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-2">
          {{ formatCurrency(summary.total_estimated_value) }}
        </span>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Valor total estimado em estoque
        </span>
      </div>

      <!-- Estoque Baixo / Reposição -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Estoque Baixo
          </span>
          <span
            :class="[
              'text-xs font-bold px-2 py-0.5 rounded-md',
              summary.low_stock_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            ]"
          >
            {{ summary.low_stock_count }} itens
          </span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <AlertTriangle
            :class="['w-6 h-6', summary.low_stock_count > 0 ? 'text-amber-500' : 'text-slate-300']"
          />
          <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {{ summary.low_stock_count === 0 ? 'Tudo em dia' : 'Repor Estoque' }}
          </span>
        </div>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Itens no limite mínimo ou esgotados
        </span>
      </div>

      <!-- Validades / Vencendo -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span
            :class="[
              'text-xs font-bold uppercase tracking-wider',
              summary.expired_count > 0 ? 'text-rose-600' : 'text-slate-400'
            ]"
          >
            Validade & Prazos
          </span>
          <span
            v-if="summary.expired_count > 0"
            class="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700"
          >
            {{ summary.expired_count }} vencido(s)
          </span>
          <span
            v-else
            class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
          >
            {{ summary.expiring_soon_count }} em 30d
          </span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <AlertCircle
            :class="[
              'w-6 h-6',
              summary.expired_count > 0 ? 'text-rose-500' : summary.expiring_soon_count > 0 ? 'text-amber-500' : 'text-emerald-500'
            ]"
          />
          <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {{ summary.expired_count > 0 ? `${summary.expired_count} Vencidos` : `${summary.expiring_soon_count} Vencendo` }}
          </span>
        </div>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Atenção a alimentos e remédios
        </span>
      </div>

      <!-- Duração & Recorrência -->
      <div class="rounded-2xl sm:rounded-3xl bg-white p-5 border border-slate-100 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Consumo Regular
          </span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            Inteligente
          </span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <Sparkles class="w-6 h-6 text-emerald-500" />
          <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Preço & Duração
          </span>
        </div>
        <span class="text-xs text-slate-400 font-medium block mt-1">
          Média automática a cada nova compra
        </span>
      </div>
    </div>

    <!-- Search and Filters Toolbar -->
    <div class="bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-2xs space-y-4">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome (ex: Shampoo, Arroz), marca (ex: Ypê) ou notas..."
            class="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Sort selector -->
        <div class="w-full lg:w-64">
          <select
            v-model="sortBy"
            class="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="name_asc">Nome (A - Z)</option>
            <option value="name_desc">Nome (Z - A)</option>
            <option value="expiration_date">Validade mais próxima</option>
            <option value="price_desc">Maior valor unitário</option>
            <option value="duration">Maior duração (dias)</option>
            <option value="recent">Cadastrados recentemente</option>
          </select>
        </div>
      </div>

      <!-- Categories Pills with colors -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          @click="selectedCategoryId = null"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border',
            selectedCategoryId === null
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
          ]"
        >
          Todas as Categorias
        </button>

        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="selectedCategoryId = cat.id"
          :style="{
            borderColor: selectedCategoryId === cat.id ? cat.color_hex : undefined,
            backgroundColor: selectedCategoryId === cat.id ? `${cat.color_hex}15` : undefined,
            color: selectedCategoryId === cat.id ? cat.color_hex : undefined,
          }"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 border',
            selectedCategoryId === cat.id
              ? 'shadow-2xs font-extrabold'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
          ]"
        >
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: cat.color_hex }"
          />
          <span>{{ cat.name }}</span>
          <span
            v-if="cat.items_count !== undefined"
            class="text-[10px] opacity-70 font-semibold ml-0.5"
          >
            ({{ cat.items_count }})
          </span>
        </button>

        <!-- Status Filter Pills -->
        <span class="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        <button
          type="button"
          @click="selectedStatus = selectedStatus === 'low_stock' ? 'all' : 'low_stock'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 border',
            selectedStatus === 'low_stock'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/60'
          ]"
        >
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>Estoque Baixo</span>
        </button>

        <button
          type="button"
          @click="selectedStatus = selectedStatus === 'expiring_soon' ? 'all' : 'expiring_soon'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 border',
            selectedStatus === 'expiring_soon'
              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/60'
          ]"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Vencendo</span>
        </button>

        <!-- Clear filters button -->
        <button
          v-if="searchQuery || selectedCategoryId !== null || selectedStatus !== 'all'"
          type="button"
          @click="clearFilters"
          class="ml-auto text-xs font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
        >
          Limpar filtros
        </button>
      </div>
    </div>

    <!-- Items Grid Container -->
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center bg-white rounded-3xl border border-slate-100">
        <RefreshCw class="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p class="text-sm font-bold text-slate-600">Carregando itens do estoque...</p>
      </div>

      <!-- Items Grid -->
      <div v-else-if="items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
        >
          <!-- Top Row: Category & Badges -->
          <div>
            <div class="flex items-start justify-between gap-2">
              <!-- Category Pill -->
              <span
                v-if="item.category"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                :style="{
                  backgroundColor: `${item.category.color_hex}15`,
                  color: item.category.color_hex
                }"
              >
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: item.category.color_hex }"
                />
                <span>{{ item.category.name }}</span>
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-500"
              >
                Sem categoria
              </span>

              <!-- Expiration or Status Badge -->
              <div class="flex items-center gap-1.5">
                <span
                  v-if="getExpirationBadge(item)"
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    getExpirationBadge(item)?.classes
                  ]"
                >
                  <component :is="getExpirationBadge(item)?.icon" class="w-3 h-3" />
                  <span>{{ getExpirationBadge(item)?.text }}</span>
                </span>

                <span
                  v-else-if="item.status === 'low_stock' || item.status === 'out_of_stock'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60"
                >
                  <AlertTriangle class="w-3 h-3" />
                  <span>{{ item.status === 'out_of_stock' ? 'Esgotado' : 'Estoque Baixo' }}</span>
                </span>
              </div>
            </div>

            <!-- Item Name & Brand -->
            <div class="mt-3.5">
              <h3 class="text-base font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                {{ item.name }}
              </h3>
              <p v-if="item.brand" class="text-xs font-semibold text-slate-400 mt-0.5">
                {{ item.brand }}
              </p>
            </div>

            <!-- Quantity & Quick Stepper -->
            <div class="mt-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Em Estoque
                </span>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span
                    :class="[
                      'text-xl font-black',
                      item.quantity <= 0
                        ? 'text-rose-600'
                        : item.min_quantity !== null && item.min_quantity !== undefined && item.quantity <= item.min_quantity
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    ]"
                  >
                    {{ item.quantity }}
                  </span>
                  <span class="text-xs font-semibold text-slate-500">
                    {{ item.unit || 'un' }}
                  </span>
                </div>
              </div>

              <!-- Stepper buttons -->
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="handleConsumeOne(item)"
                  :disabled="item.quantity <= 0"
                  title="Consumir 1 unidade"
                  class="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center font-bold transition shadow-2xs cursor-pointer"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  @click="openRestockModal(item)"
                  title="Registrar nova compra / reposição"
                  class="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold transition shadow-2xs cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Price & Duration Metrics -->
            <div class="mt-3.5 grid grid-cols-2 gap-2 text-xs">
              <!-- Preço Médio e Último Preço -->
              <div class="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preço Médio
                </span>
                <span class="text-xs font-black text-slate-800 block mt-0.5">
                  {{ item.average_price ? formatCurrency(item.average_price) : (item.last_price ? formatCurrency(item.last_price) : 'Não informado') }}
                </span>
                <span v-if="item.last_price" class="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Último: {{ formatCurrency(item.last_price) }}
                </span>
              </div>

              <!-- Duração Média -->
              <div class="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Duração
                </span>
                <div class="flex items-center gap-1 mt-0.5">
                  <Clock class="w-3 h-3 text-indigo-500 shrink-0" />
                  <span class="text-xs font-black text-slate-800">
                    {{ item.duration_days ? `~${item.duration_days} dias` : 'Não estimada' }}
                  </span>
                </div>
                <span v-if="item.estimated_monthly_cost" class="text-[10px] text-indigo-600 font-bold block mt-0.5">
                  ~{{ formatCurrency(item.estimated_monthly_cost) }}/mês
                </span>
              </div>
            </div>

            <!-- Notes if any -->
            <p v-if="item.notes" class="mt-2.5 text-[11px] text-slate-400 italic truncate">
              • {{ item.notes }}
            </p>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <!-- Restock Button -->
            <button
              type="button"
              @click="openRestockModal(item)"
              class="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShoppingCart class="w-3.5 h-3.5" />
              <span>+ Comprar</span>
            </button>

            <!-- Edit Button -->
            <button
              type="button"
              @click="openEditModal(item)"
              title="Editar item"
              class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Pencil class="w-4 h-4" />
            </button>

            <!-- Delete Button -->
            <button
              type="button"
              @click="handleDeleteItem(item)"
              title="Excluir item"
              class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="py-20 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50"
      >
        <Package class="w-14 h-14 text-slate-300 mb-3.5" />
        <h3 class="text-base font-bold text-slate-700">
          Nenhum item encontrado no estoque
        </h3>
        <p class="text-xs text-slate-400 mt-1 max-w-md">
          {{
            searchQuery || selectedCategoryId !== null || selectedStatus !== 'all'
              ? 'Não encontramos nenhum item com os filtros selecionados. Tente alterar sua pesquisa.'
              : 'Cadastre os primeiros produtos da sua casa (shampoo, arroz, sabão, etc.) para controlar compras, validade e duração média.'
          }}
        </p>

        <div class="mt-5 flex items-center gap-3">
          <button
            v-if="searchQuery || selectedCategoryId !== null || selectedStatus !== 'all'"
            type="button"
            @click="clearFilters"
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Limpar Filtros
          </button>

          <button
            type="button"
            @click="openCreateModal"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span>Cadastrar Primeiro Item</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Create / Edit Item Modal -->
    <InventoryItemModal
      :is-open="isItemModalOpen"
      :item="selectedItemForEdit"
      :categories="categories"
      @close="isItemModalOpen = false"
      @saved="loadItems"
    />

    <!-- Restock / Record Purchase Modal -->
    <RestockModal
      :is-open="isRestockModalOpen"
      :item="selectedItemForRestock"
      @close="isRestockModalOpen = false"
      @restocked="loadItems"
    />
  </div>
</template>
