import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DashboardSummary,
  QuarterlyMonth,
  Subscription,
  FixedBill,
  BankAccount,
  CreditCard,
  TransactionMutation,
  TransactionItem,
} from '@/types/finance'
import { financialService } from '@/services/financialService'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'flux_dashboard_state_v1'
const QUEUE_STORAGE_KEY = 'flux_offline_queue_v1'

const defaultSummary: DashboardSummary = {
  total_balance: 4848.11,
  balance_period: 'este mês',
  monthly_income: 5050.00,
  monthly_expenses: 201.89,
  user_name: 'Alex',
  greeting_subtitle: 'Suas finanças estão saudáveis.',
}

const defaultQuarterlyData: QuarterlyMonth[] = [
  { month: 'Jul', income: 4300, expenses: 1450 },
  { month: 'Ago', income: 4100, expenses: 1300 },
  { month: 'Set', income: 5050, expenses: 201.89 },
]

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const summary = ref<DashboardSummary>({ ...defaultSummary })
  const quarterlyData = ref<QuarterlyMonth[]>([...defaultQuarterlyData])
  const familySubscriptions = ref<Subscription[]>([])
  const upcomingBills = ref<FixedBill[]>([])
  const bankAccounts = ref<BankAccount[]>([])
  const creditCards = ref<CreditCard[]>([])
  const recentTransactions = ref<TransactionItem[]>([])
  const offlineQueue = ref<TransactionMutation[]>([])
  const lastSyncDate = ref<string>(new Date().toISOString())
  const isSyncing = ref(false)
  const isFetching = ref(false)
  const apiError = ref<string | null>(null)

  // Getters
  const pendingBillsCount = computed(() => {
    return upcomingBills.value.filter(bill => !bill.is_paid).length
  })

  const hasOfflineChanges = computed(() => {
    return offlineQueue.value.length > 0
  })

  const totalCreditAvailable = computed(() => {
    return creditCards.value.reduce((acc, card) => acc + (card.available_limit || 0), 0)
  })

  const totalAccountsCount = computed(() => {
    return bankAccounts.value.length + creditCards.value.length
  })

  // Persistence helpers
  const saveStateToStorage = () => {
    try {
      const payload = {
        summary: summary.value,
        quarterlyData: quarterlyData.value,
        familySubscriptions: familySubscriptions.value,
        upcomingBills: upcomingBills.value,
        bankAccounts: bankAccounts.value,
        creditCards: creditCards.value,
        recentTransactions: recentTransactions.value,
        lastSyncDate: lastSyncDate.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(offlineQueue.value))
    } catch (e) {
      console.warn('Falha ao salvar estado localmente no localStorage', e)
    }
  }

  const loadStateFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.summary) summary.value = parsed.summary
        if (parsed.quarterlyData) quarterlyData.value = parsed.quarterlyData
        if (parsed.familySubscriptions) familySubscriptions.value = parsed.familySubscriptions
        if (parsed.upcomingBills) upcomingBills.value = parsed.upcomingBills
        if (parsed.bankAccounts) bankAccounts.value = parsed.bankAccounts
        if (parsed.creditCards) creditCards.value = parsed.creditCards
        if (parsed.recentTransactions) recentTransactions.value = parsed.recentTransactions
        if (parsed.lastSyncDate) lastSyncDate.value = parsed.lastSyncDate
      }

      const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (storedQueue) {
        offlineQueue.value = JSON.parse(storedQueue)
      }
    } catch (e) {
      console.warn('Falha ao carregar estado do localStorage', e)
    }
  }

  const resetState = () => {
    summary.value = { ...defaultSummary }
    quarterlyData.value = [...defaultQuarterlyData]
    familySubscriptions.value = []
    upcomingBills.value = []
    bankAccounts.value = []
    creditCards.value = []
    recentTransactions.value = []
    offlineQueue.value = []
    lastSyncDate.value = new Date().toISOString()
    apiError.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    } catch (e) {
      console.warn('Falha ao limpar armazenamento local', e)
    }
  }

  // Live API Integration
  const fetchDashboardData = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnline) return // use cached data

    isFetching.value = true
    apiError.value = null

    try {
      const isAuthenticated = await authStore.ensureAuthenticated()
      if (!isAuthenticated) return

      if (offlineQueue.value.length > 0 && !isSyncing.value) {
        await syncPendingQueue()
      }

      const [accountsRes, cardsRes, billsRes, subsRes, txRes] = await Promise.all([
        financialService.getBankAccounts().catch(() => null),
        financialService.getCreditCards().catch(() => null),
        financialService.getFixedBills().catch(() => null),
        financialService.getSubscriptions().catch(() => null),
        financialService.getTransactions().catch(() => null),
      ])

      // 1. Process Bank Accounts
      if (accountsRes?.data && Array.isArray(accountsRes.data)) {
        bankAccounts.value = accountsRes.data.map((acc: any) => {
          const balance = Number(acc.current_balance || 0)
          const dailyLimit = acc.daily_limit || (acc.name?.includes('Chase') ? 5000 : 10000)
          const limitUsedPct = Math.min(100, Math.round((balance / dailyLimit) * 100))

          return {
            id: acc.id,
            workspace_id: acc.workspace_id,
            bank_name: acc.bank_name || acc.name || 'Conta',
            name: acc.name || acc.bank_name || 'Conta',
            type: acc.type || 'checking',
            current_balance: balance,
            color_hex: acc.color_hex || '#2563eb',
            is_active: !!acc.is_active,
            badge: acc.type === 'other' ? 'CREDIT' : 'DEBIT',
            account_number: `•••• ${String(acc.id).padStart(4, '492')}`,
            daily_limit: dailyLimit,
            limit_used_percentage: limitUsedPct,
          }
        })

        // Recalculate total balance
        const total = bankAccounts.value.reduce((acc, curr) => acc + curr.current_balance, 0)
        summary.value.total_balance = Math.round(total * 100) / 100
      }

      // 2. Process Credit Cards
      if (cardsRes?.data && Array.isArray(cardsRes.data)) {
        creditCards.value = cardsRes.data.map((card: any) => {
          const totalLimit = Number(card.total_limit || 0)
          const availLimit = Number(card.available_limit !== undefined ? card.available_limit : card.total_limit)
          const usedLimit = Math.max(0, Math.round((totalLimit - availLimit) * 100) / 100)
          const usedPercentage = totalLimit > 0 ? Math.min(100, Math.round((usedLimit / totalLimit) * 100)) : 0

          return {
            id: card.id,
            workspace_id: card.workspace_id,
            bank_account_id: card.bank_account_id,
            bank_account: card.bank_account,
            type: card.type || 'credit',
            name: card.name,
            total_limit: totalLimit,
            available_limit: availLimit,
            used_limit: usedLimit,
            used_percentage: usedPercentage,
            closing_day: Number(card.closing_day || 5),
            due_day: Number(card.due_day || 12),
            daily_limit: card.daily_limit ? Number(card.daily_limit) : undefined,
            brand: card.brand || 'Mastercard',
            color_hex: card.color_hex || '#ea580c',
            is_active: !!card.is_active,
            badge: card.type === 'debit' ? 'DEBIT' : 'CREDIT',
            card_last_digits: `•••• ${String(card.id).padStart(4, '882')}`,
          }
        })
      }

      // 2. Process Fixed Bills (Upcoming Bills)
      if (billsRes?.data && Array.isArray(billsRes.data)) {
        const today = new Date().getDate()
        upcomingBills.value = billsRes.data.map((bill: any) => {
          const diffDays = bill.due_day - today
          let status: 'urgent' | 'pending' | 'scheduled' = 'scheduled'
          let status_text = `Agendado • ${Math.abs(diffDays)} Dias`

          if (diffDays <= 0) {
            status = 'urgent'
            status_text = diffDays === 0 ? 'Urgente • Hoje' : `Urgente • Atrasado (${Math.abs(diffDays)}d)`
          } else if (diffDays <= 3) {
            status = 'pending'
            status_text = `Pendente • ${diffDays} Dias`
          }

          return {
            id: bill.id,
            workspace_id: bill.workspace_id,
            name: bill.name,
            type: bill.type || 'expense',
            estimated_amount: Number(bill.estimated_amount || 0),
            due_day: bill.due_day,
            is_active: !!bill.is_active,
            is_reminder_active: !!bill.is_reminder_active,
            status,
            status_text,
            is_paid: false,
          }
        })
      }

      // 3. Process Subscriptions (Family Subscriptions)
      if (subsRes?.data && Array.isArray(subsRes.data)) {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const todayDay = new Date().getDate()

        familySubscriptions.value = subsRes.data.map((sub: any) => {
          const serviceName = sub.service_name || ''
          const lower = serviceName.toLowerCase()

          let icon_type = 'SUB'
          let icon_bg = sub.color_hex || '#6366f1'
          let category_name = 'Assinatura'

          if (lower.includes('netflix')) {
            icon_type = 'NET'
            if (!sub.color_hex) icon_bg = '#141414'
            category_name = 'Entretenimento'
          } else if (lower.includes('spotify')) {
            icon_type = 'SPO'
            if (!sub.color_hex) icon_bg = '#1db954'
            category_name = 'Música'
          } else if (lower.includes('icloud') || lower.includes('apple')) {
            icon_type = 'ICL'
            if (!sub.color_hex) icon_bg = '#2563eb'
            category_name = 'Armazenamento'
          } else if (lower.includes('prime') || lower.includes('amazon')) {
            icon_type = 'PRM'
            if (!sub.color_hex) icon_bg = '#00a8e1'
            category_name = 'Entretenimento'
          } else if (lower.includes('disney')) {
            icon_type = 'DIS'
            if (!sub.color_hex) icon_bg = '#113ccf'
            category_name = 'Entretenimento'
          } else if (lower.includes('youtube')) {
            icon_type = 'YOU'
            if (!sub.color_hex) icon_bg = '#ef4444'
            category_name = 'Vídeo'
          } else if (lower.includes('chatgpt') || lower.includes('openai')) {
            icon_type = 'GPT'
            if (!sub.color_hex) icon_bg = '#10a37f'
            category_name = 'Inteligência Artificial'
          } else if (lower.includes('max') || lower.includes('hbo')) {
            icon_type = 'MAX'
            if (!sub.color_hex) icon_bg = '#002be7'
            category_name = 'Streaming'
          } else {
            icon_type = serviceName.trim().slice(0, 3).toUpperCase() || 'SUB'
          }

          const members = (sub.members || []).map((m: any) => {
            const currentPayment = (m.payments || []).find((p: any) => p.reference_month === currentMonth)
            const hasPaid = currentPayment
              ? (currentPayment.status === 'paid' || currentPayment.status === 'pago')
              : (m.payments && m.payments.some((p: any) => p.status === 'paid' || p.status === 'pago'))

            return {
              id: m.id,
              subscription_id: sub.id,
              name: m.name,
              contact: m.contact,
              initials: m.name ? m.name.charAt(0).toUpperCase() : 'U',
              avatar_color: '#10b981',
              installment_amount: Number(m.installment_amount || 0),
              is_paid: !!hasPaid,
              payments: m.payments || [],
            }
          })

          const paidCount = members.filter((m: any) => m.is_paid).length
          const diffDays = Number(sub.billing_day || 1) - todayDay
          let due_text = ''
          if (diffDays === 0) {
            due_text = 'Vence hoje'
          } else if (diffDays > 0) {
            due_text = `Vence dia ${sub.billing_day} (${diffDays}d)`
          } else {
            due_text = `Venceu dia ${sub.billing_day} (${Math.abs(diffDays)}d atrás)`
          }

          const card = sub.credit_card || (sub.credit_card_id ? creditCards.value.find(c => c.id === sub.credit_card_id) : null)
          const account = sub.bank_account || (sub.bank_account_id ? bankAccounts.value.find(a => a.id === sub.bank_account_id) : null)

          return {
            id: sub.id,
            workspace_id: sub.workspace_id,
            service_name: serviceName,
            color_hex: sub.color_hex || icon_bg,
            icon_type,
            icon_bg: sub.color_hex || icon_bg,
            total_amount: Number(sub.total_amount || 0),
            billing_day: Number(sub.billing_day || 1),
            due_text,
            category_id: sub.category_id,
            category_name: sub.category?.name || category_name,
            credit_card_id: sub.credit_card_id,
            bank_account_id: sub.bank_account_id,
            credit_card: card,
            bank_account: account,
            is_active: sub.is_active !== undefined ? !!sub.is_active : true,
            notes: sub.notes,
            members,
            paid_count: paidCount,
            total_members: members.length || 1,
            is_family: members.length > 0,
          }
        })
      }

      // 4. Process Transactions & Quarterly Stats
      if (txRes?.data && Array.isArray(txRes.data)) {
        recentTransactions.value = txRes.data.map((tx: any) => ({
          id: tx.id,
          workspace_id: tx.workspace_id,
          type: tx.type,
          amount: Number(tx.amount || 0),
          occurred_at: tx.occurred_at,
          status: tx.status || 'paid',
          description: tx.description,
          bank_account_id: tx.bank_account_id,
          credit_card_id: tx.credit_card_id,
          category_id: tx.category_id,
          notes: tx.notes,
          installment_number: tx.installment_number,
          total_installments: tx.total_installments,
          installment_group_id: tx.installment_group_id,
          bank_account: tx.bank_account,
          credit_card: tx.credit_card,
          category: tx.category,
          created_at: tx.created_at,
        }))

        let septIncome = 0
        let septExpense = 0
        let augIncome = 0
        let augExpense = 0
        let julIncome = 0
        let julExpense = 0

        for (const tx of txRes.data) {
          const amount = Number(tx.amount ?? tx.valor ?? 0)
          const dateStr = tx.occurred_at || tx.data_ocorrencia || ''
          const month = dateStr.slice(5, 7) // '07', '08', '09'

          if (tx.type === 'income' || tx.tipo === 'receita') {
            if (month === '09') septIncome += amount
            else if (month === '08') augIncome += amount
            else if (month === '07') julIncome += amount
          } else {
            if (month === '09') septExpense += amount
            else if (month === '08') augExpense += amount
            else if (month === '07') julExpense += amount
          }
        }

        if (septIncome > 0 || septExpense > 0) {
          summary.value.monthly_income = septIncome || 5050.00
          summary.value.monthly_expenses = septExpense || 201.89
        }

        quarterlyData.value = [
          { month: 'Jul', income: julIncome || 4300, expenses: julExpense || 1450 },
          { month: 'Ago', income: augIncome || 4100, expenses: augExpense || 1300 },
          { month: 'Set', income: septIncome || 5050, expenses: septExpense || 201.89 },
        ]
      }

      if (authStore.user?.name) {
        summary.value.user_name = authStore.user.name
      }

      lastSyncDate.value = new Date().toISOString()
      saveStateToStorage()
    } catch (err: any) {
      console.warn('Erro ao carregar dados da API, utilizando dados em cache', err)
      apiError.value = err.message || 'Falha ao sincronizar dados da API'
    } finally {
      isFetching.value = false
    }
  }

  // Actions
  const addTransaction = async (payload: {
    type: 'income' | 'expense'
    amount: number
    description: string
    bank_account_id?: number
    credit_card_id?: number
    category?: string
    is_installment?: boolean
    installments_count?: number
  }) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // If payment is via credit card
    if (payload.credit_card_id) {
      const card = creditCards.value.find(c => c.id === payload.credit_card_id)
      if (card) {
        // Block limit on the card
        card.available_limit = Math.max(0, (card.available_limit || card.total_limit) - payload.amount)
        card.used_limit = Math.max(0, card.total_limit - card.available_limit)
        card.used_percentage = card.total_limit > 0 ? Math.min(100, Math.round((card.used_limit / card.total_limit) * 100)) : 0
      }

      // Monthly expenses impact (first installment if installment purchase)
      const expenseImpact = payload.is_installment && payload.installments_count && payload.installments_count > 1
        ? Math.round((payload.amount / payload.installments_count) * 100) / 100
        : payload.amount

      summary.value.monthly_expenses += expenseImpact
      if (quarterlyData.value.length > 0) {
        const currentMonth = quarterlyData.value[quarterlyData.value.length - 1]
        if (currentMonth) {
          currentMonth.expenses += expenseImpact
        }
      }
    } else {
      // Optimistic calculation for bank account
      if (payload.type === 'income') {
        summary.value.total_balance += payload.amount
        summary.value.monthly_income += payload.amount
        if (quarterlyData.value.length > 0) {
          const currentMonth = quarterlyData.value[quarterlyData.value.length - 1]
          if (currentMonth) {
            currentMonth.income += payload.amount
          }
        }
      } else {
        summary.value.total_balance -= payload.amount
        summary.value.monthly_expenses -= payload.amount
        if (quarterlyData.value.length > 0) {
          const currentMonth = quarterlyData.value[quarterlyData.value.length - 1]
          if (currentMonth) {
            currentMonth.expenses += payload.amount
          }
        }
      }

      // Update account if specified
      if (payload.bank_account_id) {
        const targetAccount = bankAccounts.value.find(acc => acc.id === payload.bank_account_id)
        if (targetAccount) {
          if (payload.type === 'income') {
            targetAccount.current_balance += payload.amount
          } else {
            targetAccount.current_balance -= payload.amount
          }
        }
      } else if (bankAccounts.value.length > 0 && bankAccounts.value[0]) {
        if (payload.type === 'income') {
          bankAccounts.value[0].current_balance += payload.amount
        } else {
          bankAccounts.value[0].current_balance -= payload.amount
        }
      }
    }

    const mutation: TransactionMutation = {
      id: transactionId,
      type: payload.type,
      amount: payload.amount,
      description: payload.description,
      occurred_at: new Date().toISOString().split('T')[0] || new Date().toISOString(),
      bank_account_id: payload.bank_account_id,
      credit_card_id: payload.credit_card_id,
      category: payload.category,
      is_installment: payload.is_installment,
      installments_count: payload.installments_count,
      timestamp: Date.now(),
      synced: isOnline,
    }

    // Optimistic addition to recentTransactions
    const optimisticTx: TransactionItem = {
      id: Date.now(),
      type: payload.type,
      amount: payload.amount,
      description: payload.description,
      occurred_at: mutation.occurred_at,
      status: payload.credit_card_id ? 'pending' : 'paid',
      installment_number: payload.is_installment ? 1 : null,
      total_installments: payload.installments_count || null,
      bank_account: payload.bank_account_id ? bankAccounts.value.find(a => a.id === payload.bank_account_id) : null,
      credit_card: payload.credit_card_id ? creditCards.value.find(c => c.id === payload.credit_card_id) : null,
      category: payload.category ? { id: 0, name: payload.category } : null,
    }
    recentTransactions.value = [optimisticTx, ...recentTransactions.value]

    if (!isOnline) {
      offlineQueue.value.push(mutation)
      saveStateToStorage()
    } else {
      // Send directly to API
      try {
        const isCard = !!payload.credit_card_id
        await financialService.createTransaction({
          type: payload.type,
          amount: payload.amount,
          occurred_at: mutation.occurred_at,
          status: isCard ? 'pending' : 'paid',
          description: payload.description,
          bank_account_id: isCard ? undefined : payload.bank_account_id,
          credit_card_id: payload.credit_card_id,
          is_installment: payload.is_installment,
          installments_count: payload.installments_count,
        })
        await fetchDashboardData()
      } catch (e: any) {
        console.error('Falha no envio da transação para a API', e?.response?.data || e)
        mutation.synced = false
        offlineQueue.value.push(mutation)
      }
    }

    lastSyncDate.value = new Date().toISOString()
    saveStateToStorage()

    return mutation
  }

  const toggleBillPaid = async (billId: number) => {
    const bill = upcomingBills.value.find(b => b.id === billId)
    if (!bill) return

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    bill.is_paid = !bill.is_paid

    if (bill.is_paid) {
      bill.status_text = 'Pago'
      summary.value.total_balance -= bill.estimated_amount
      summary.value.monthly_expenses += bill.estimated_amount
      if (bankAccounts.value.length > 0 && bankAccounts.value[0]) {
        bankAccounts.value[0].current_balance -= bill.estimated_amount
      }

      if (isOnline) {
        try {
          await financialService.payFixedBill(billId, {
            amount: bill.estimated_amount,
            payment_date: new Date().toISOString().split('T')[0],
          })
        } catch (e) {
          console.warn('Falha ao liquidar conta na API, mantendo localmente', e)
        }
      }
    } else {
      bill.status_text = 'Pendente • Hoje'
      summary.value.total_balance += bill.estimated_amount
      summary.value.monthly_expenses -= bill.estimated_amount
      if (bankAccounts.value.length > 0 && bankAccounts.value[0]) {
        bankAccounts.value[0].current_balance += bill.estimated_amount
      }
    }

    saveStateToStorage()
  }

  const addAccount = async (account: Omit<BankAccount, 'id'>) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    const newId = bankAccounts.value.length > 0 ? Math.max(...bankAccounts.value.map(a => a.id)) + 1 : 1
    const newAccount: BankAccount = {
      ...account,
      id: newId,
    }
    bankAccounts.value.push(newAccount)
    saveStateToStorage()

    if (isOnline) {
      try {
        const res = await financialService.createBankAccount({
          bank_name: account.bank_name,
          name: account.name,
          type: account.type,
          current_balance: account.current_balance,
          color_hex: account.color_hex,
          is_active: true,
        })
        if (res?.data?.id) {
          newAccount.id = res.data.id
          saveStateToStorage()
        }
      } catch (e) {
        console.warn('Falha ao registrar conta no servidor', e)
      }
    }

    summary.value.total_balance = bankAccounts.value.reduce((acc, curr) => acc + curr.current_balance, 0)
    saveStateToStorage()
  }

  const addCreditCard = async (cardData: {
    bank_account_id: number
    type: 'credit' | 'debit'
    name: string
    brand: string
    total_limit?: number
    daily_limit?: number
    closing_day?: number
    due_day?: number
    color_hex?: string
    card_last_digits?: string
  }) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    const newId = creditCards.value.length > 0 ? Math.max(...creditCards.value.map(c => c.id)) + 1 : 1
    const linkedAccount = bankAccounts.value.find(a => a.id === cardData.bank_account_id)
    const totalLimit = Number(cardData.total_limit || 0)

    const newCard: CreditCard = {
      id: newId,
      bank_account_id: cardData.bank_account_id,
      bank_account: linkedAccount ? { id: linkedAccount.id, name: linkedAccount.name, color_hex: linkedAccount.color_hex } : null,
      type: cardData.type,
      name: cardData.name,
      brand: cardData.brand || 'Mastercard',
      total_limit: totalLimit,
      available_limit: totalLimit,
      daily_limit: cardData.daily_limit,
      closing_day: cardData.closing_day || 5,
      due_day: cardData.due_day || 12,
      color_hex: cardData.color_hex || '#ea580c',
      is_active: true,
      badge: cardData.type === 'debit' ? 'DEBIT' : 'CREDIT',
      card_last_digits: cardData.card_last_digits || `•••• ${String(newId).padStart(4, '882')}`,
      used_limit: 0,
      used_percentage: 0,
    }
    creditCards.value.push(newCard)
    saveStateToStorage()

    if (isOnline) {
      try {
        const res = await financialService.createCreditCard({
          bank_account_id: cardData.bank_account_id,
          type: cardData.type,
          name: cardData.name,
          brand: cardData.brand,
          total_limit: cardData.total_limit,
          daily_limit: cardData.daily_limit,
          closing_day: cardData.closing_day,
          due_day: cardData.due_day,
          color_hex: cardData.color_hex || '#ea580c',
          is_active: true,
        })
        if (res?.data?.id) {
          newCard.id = res.data.id
          saveStateToStorage()
        }
      } catch (e) {
        console.warn('Falha ao registrar cartão no servidor', e)
      }
    }
  }

  const fetchCardMonthlyLimits = async (cardId: number, months: number = 12) => {
    try {
      const res = await financialService.getCardMonthlyLimits(cardId, months)
      return (res?.data || []) as import('@/types/finance').MonthlyCardLimit[]
    } catch (e) {
      console.warn('Falha ao obter limites mensais do cartão', e)
      return [] as import('@/types/finance').MonthlyCardLimit[]
    }
  }

  const deleteBankAccount = async (accountId: number) => {
    bankAccounts.value = bankAccounts.value.filter(a => a.id !== accountId)
    summary.value.total_balance = bankAccounts.value.reduce((acc, curr) => acc + curr.current_balance, 0)
    saveStateToStorage()

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (isOnline) {
      try {
        await financialService.deleteBankAccount(accountId)
      } catch (e) {
        console.warn('Falha ao excluir conta bancária na API', e)
      }
    }
  }

  const deleteCreditCard = async (cardId: number) => {
    creditCards.value = creditCards.value.filter(c => c.id !== cardId)
    saveStateToStorage()

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (isOnline) {
      try {
        await financialService.deleteCreditCard(cardId)
      } catch (e) {
        console.warn('Falha ao excluir cartão na API', e)
      }
    }
  }

  const syncPendingQueue = async () => {
    if (offlineQueue.value.length === 0 || isSyncing.value) {
      return
    }

    isSyncing.value = true
    try {
      const queueCopy = [...offlineQueue.value]
      for (const item of queueCopy) {
        try {
          const isCard = !!item.credit_card_id
          await financialService.createTransaction({
            type: item.type,
            amount: item.amount,
            occurred_at: item.occurred_at,
            status: isCard ? 'pending' : 'paid',
            description: item.description,
            bank_account_id: isCard ? undefined : item.bank_account_id,
            credit_card_id: item.credit_card_id,
            is_installment: item.is_installment,
            installments_count: item.installments_count,
          })
          offlineQueue.value = offlineQueue.value.filter(q => q.id !== item.id)
        } catch (e) {
          console.warn('Falha ao sincronizar item offline', e)
        }
      }

      lastSyncDate.value = new Date().toISOString()
      saveStateToStorage()
    } finally {
      isSyncing.value = false
    }
  }

  const createSubscription = async (payload: {
    service_name: string
    color_hex?: string | null
    total_amount: number
    billing_day: number
    credit_card_id?: number | null
    bank_account_id?: number | null
    category_id?: number | null
    notes?: string | null
    members?: Array<{
      name: string
      installment_amount: number
      contact?: string | null
    }>
  }) => {
    const res = await financialService.createSubscription(payload)
    await fetchDashboardData()
    return res
  }

  const deleteSubscription = async (id: number) => {
    familySubscriptions.value = familySubscriptions.value.filter(s => s.id !== id)
    saveStateToStorage()
    try {
      await financialService.deleteSubscription(id)
      await fetchDashboardData()
    } catch (e) {
      console.warn('Falha ao excluir assinatura na API', e)
    }
  }

  const toggleMemberPayment = async (subscriptionId: number, memberId: number) => {
    const sub = familySubscriptions.value.find(s => s.id === subscriptionId)
    if (!sub) return

    const member = sub.members.find(m => m.id === memberId)
    if (!member) return

    // Optimistic toggle
    member.is_paid = !member.is_paid
    sub.paid_count = sub.members.filter(m => m.is_paid).length
    saveStateToStorage()

    const currentMonth = new Date().toISOString().slice(0, 7)
    try {
      await financialService.recordMemberPayment(subscriptionId, memberId, {
        reference_month: currentMonth,
        status: member.is_paid ? 'paid' : 'pending',
      })
    } catch (e) {
      console.warn('Falha ao registrar pagamento do membro na API', e)
    }
  }

  const fetchFullTransactions = async (params?: Record<string, any>) => {
    try {
      const response = await financialService.getTransactions(params)
      return response
    } catch (err) {
      console.warn('Falha ao buscar transações completas', err)
      return { data: recentTransactions.value, meta: null }
    }
  }

  // Load cached state on initialization
  loadStateFromStorage()

  return {
    summary,
    quarterlyData,
    familySubscriptions,
    upcomingBills,
    bankAccounts,
    creditCards,
    recentTransactions,
    offlineQueue,
    lastSyncDate,
    isSyncing,
    isFetching,
    apiError,
    pendingBillsCount,
    hasOfflineChanges,
    totalCreditAvailable,
    totalAccountsCount,
    fetchDashboardData,
    fetchFullTransactions,
    createSubscription,
    deleteSubscription,
    toggleMemberPayment,
    resetState,
    addTransaction,
    toggleBillPaid,
    addAccount,
    addCreditCard,
    fetchCardMonthlyLimits,
    deleteBankAccount,
    deleteCreditCard,
    syncPendingQueue,
  }
})
