<script setup lang="ts">
import { computed } from 'vue'
import {
  Users,
  Check,
  CreditCard as CreditCardIcon,
  Building2,
  Trash2,
  Calendar,
  Sparkles,
  UserCheck,
  RotateCcw,
  Pencil,
} from 'lucide-vue-next'
import { formatCurrency } from '@/utils/formatters'
import type { Subscription, SubscriptionMember } from '@/types/finance'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  (e: 'toggleMember', subId: number, memberId: number): void
  (e: 'toggleSubscription', subId: number): void
  (e: 'delete', subId: number): void
  (e: 'edit', subscription: Subscription): void
}>()

const isAllPaid = computed(() => {
  return props.subscription.total_members > 0 && props.subscription.paid_count === props.subscription.total_members
})

const progressPercentage = computed(() => {
  if (props.subscription.total_members <= 0) return 0
  return Math.min(100, Math.round((props.subscription.paid_count / props.subscription.total_members) * 100))
})

const perPersonAmount = computed(() => {
  if (props.subscription.total_members <= 0) return props.subscription.total_amount
  return Math.round((props.subscription.total_amount / props.subscription.total_members) * 100) / 100
})
</script>

<template>
  <div class="rounded-[26px] bg-white p-6 sm:p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
    <!-- Top Row: Icon, Service Name, Category, Price & Delete -->
    <div>
      <div class="flex items-start justify-between gap-3">
        <!-- Left: Logo & Details -->
        <div class="flex items-start gap-3.5 min-w-0">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-xs tracking-wider shrink-0 shadow-2xs"
            :style="{ backgroundColor: subscription.color_hex || subscription.icon_bg || '#6366f1' }"
          >
            {{ subscription.icon_type || 'SUB' }}
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                {{ subscription.service_name }}
              </h3>

              <span
                v-if="subscription.is_family"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-wider uppercase border border-indigo-100"
              >
                <Users class="w-3 h-3" />
                <span>Família</span>
              </span>
            </div>

            <!-- Subtitle info -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
              <span>{{ subscription.category_name || 'Assinatura' }}</span>
              <span>•</span>
              <span class="text-slate-600 font-semibold">{{ subscription.due_text }}</span>

              <!-- Payment Method badge -->
              <template v-if="subscription.credit_card">
                <span>•</span>
                <span class="inline-flex items-center gap-1 text-slate-600 font-semibold">
                  <CreditCardIcon class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ subscription.credit_card.name }}</span>
                </span>
              </template>
              <template v-else-if="subscription.bank_account">
                <span>•</span>
                <span class="inline-flex items-center gap-1 text-slate-600 font-semibold">
                  <Building2 class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ subscription.bank_account.name }}</span>
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- Right: Amount & Actions -->
        <div class="text-right shrink-0 flex flex-col items-end">
          <div class="flex items-center gap-1.5">
            <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ formatCurrency(subscription.total_amount) }}
            </span>
            <button
              type="button"
              @click="emit('edit', subscription)"
              title="Editar assinatura"
              class="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="emit('delete', subscription.id)"
              title="Excluir assinatura"
              class="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Por Mês
          </span>
        </div>
      </div>

      <!-- Family Plan Cycle Progress -->
      <div v-if="subscription.is_family" class="mt-6 pt-5 border-t border-slate-100">
        <!-- Progress Header -->
        <div class="flex items-center justify-between text-xs font-bold tracking-wider mb-2">
          <span class="text-slate-400 uppercase text-[11px]">
            Progresso do ciclo • {{ formatCurrency(perPersonAmount) }}/pessoa
          </span>

          <span
            :class="[
              'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
              isAllPaid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            ]"
          >
            {{ subscription.paid_count }}/{{ subscription.total_members }} pagos
          </span>
        </div>

        <!-- Progress Track -->
        <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            :class="[
              'h-full rounded-full transition-all duration-300',
              isAllPaid ? 'bg-emerald-500' : ''
            ]"
            :style="{
              width: `${progressPercentage}%`,
              backgroundColor: !isAllPaid ? (subscription.color_hex || subscription.icon_bg || '#6366f1') : undefined
            }"
          />
        </div>

        <!-- Members List -->
        <div class="mt-4 space-y-2">
          <div
            v-for="member in subscription.members"
            :key="member.id"
            @click="emit('toggleMember', subscription.id, member.id)"
            :class="[
              'flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none group',
              member.is_paid
                ? 'bg-emerald-50/50 border-emerald-100/90 hover:bg-emerald-50'
                : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
            ]"
            :title="member.is_paid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'"
          >
            <!-- Left: Status checkbox, Avatar & Name -->
            <div class="flex items-center gap-3 min-w-0">
              <!-- Toggle Checkbox circle -->
              <div
                :class="[
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                  member.is_paid
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200/90 group-hover:bg-slate-300'
                ]"
              >
                <Check v-if="member.is_paid" class="w-3.5 h-3.5 stroke-[3]" />
              </div>

              <!-- Avatar Initial -->
              <div
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-2xs',
                  member.is_paid
                    ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200'
                    : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ member.initials }}
              </div>

              <!-- Name & Cycle status -->
              <div class="truncate">
                <h4 class="text-sm font-bold text-slate-900 leading-tight truncate">
                  {{ member.name }}
                </h4>
                <span
                  :class="[
                    'text-[10px] font-extrabold uppercase tracking-wider block mt-0.5',
                    member.is_paid ? 'text-emerald-600' : 'text-slate-400'
                  ]"
                >
                  {{ member.is_paid ? 'Pago neste ciclo' : 'Pendente' }}
                </span>
              </div>
            </div>

            <!-- Right: Member Amount -->
            <span
              :class="[
                'text-sm font-bold shrink-0',
                member.is_paid ? 'text-emerald-700' : 'text-slate-700'
              ]"
            >
              {{ formatCurrency(member.installment_amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Solo / Individual Plan Bottom Banner & Pay Action -->
      <div v-else class="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Status Box -->
        <div
          v-if="subscription.is_paid"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100/90 text-emerald-800 text-xs font-bold"
        >
          <div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
            <Check class="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <span>Pago neste ciclo</span>
            <span class="text-emerald-600/90 font-medium ml-1">
              (Individual)
            </span>
          </div>
        </div>

        <div
          v-else
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs font-semibold"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Aguardando pagamento • Individual</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 self-end sm:self-auto">
          <!-- Unpay button (if paid) -->
          <button
            v-if="subscription.is_paid"
            type="button"
            @click="emit('toggleSubscription', subscription.id)"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200/80 transition cursor-pointer"
            title="Desmarcar como paga e reverter saldo"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Desmarcar</span>
          </button>

          <!-- Pay Button (if pending) -->
          <button
            v-else
            type="button"
            @click="emit('toggleSubscription', subscription.id)"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20 transition cursor-pointer"
          >
            <Check class="w-3.5 h-3.5 stroke-[3]" />
            <span>Marcar como Paga</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
