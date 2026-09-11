import { api } from './api'

export const financialService = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials)
  },

  register: async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
    return api.post('/auth/register', data)
  },

  getMe: async () => {
    return api.get('/auth/me')
  },

  logout: async () => {
    return api.post('/auth/logout')
  },

  changePassword: async (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    return api.put('/auth/password', data)
  },

  // Bank Accounts
  getBankAccounts: async () => {
    return api.get('/bank-accounts')
  },

  createBankAccount: async (data: {
    bank_name: string
    name: string
    type: string
    current_balance: number
    color_hex: string
    is_active?: boolean
  }) => {
    return api.post('/bank-accounts', data)
  },

  adjustAccountBalance: async (accountId: number, current_balance: number) => {
    return api.post(`/bank-accounts/${accountId}/adjust-balance`, { current_balance })
  },

  setPrimaryBankAccount: async (accountId: number) => {
    return api.post(`/bank-accounts/${accountId}/set-primary`)
  },

  deleteBankAccount: async (accountId: number) => {
    return api.delete(`/bank-accounts/${accountId}`)
  },

  // Credit Cards
  getCreditCards: async () => {
    return api.get('/credit-cards')
  },

  createCreditCard: async (data: {
    name: string
    brand: string
    bank_account_id?: number
    type?: 'credit' | 'debit'
    total_limit?: number
    daily_limit?: number
    closing_day?: number
    due_day?: number
    color_hex: string
    is_active?: boolean
  }) => {
    return api.post('/credit-cards', data)
  },

  getCardMonthlyLimits: async (cardId: number, months = 12) => {
    return api.get(`/credit-cards/${cardId}/monthly-limits?months=${months}`)
  },

  deleteCreditCard: async (cardId: number) => {
    return api.delete(`/credit-cards/${cardId}`)
  },

  // Fixed Bills (Upcoming Bills / Contas a Pagar)
  getFixedBills: async (params?: { reference_month?: string; active_only?: number }) => {
    let url = '/fixed-bills'
    if (params) {
      const query = new URLSearchParams()
      if (params.reference_month) query.set('reference_month', params.reference_month)
      if (params.active_only !== undefined) query.set('active_only', String(params.active_only))
      const qStr = query.toString()
      if (qStr) url += `?${qStr}`
    }
    return api.get(url)
  },

  payFixedBill: async (billId: number, data?: { amount?: number; payment_date?: string; bank_account_id?: number; credit_card_id?: number }) => {
    return api.post(`/fixed-bills/${billId}/pay`, data || {})
  },

  unpayFixedBill: async (billId: number, data?: { reference_month?: string }) => {
    return api.post(`/fixed-bills/${billId}/unpay`, data || {})
  },

  createFixedBill: async (data: any) => {
    return api.post('/fixed-bills', data)
  },

  updateFixedBill: async (id: number, data: any) => {
    return api.put(`/fixed-bills/${id}`, data)
  },

  deleteFixedBill: async (id: number) => {
    return api.delete(`/fixed-bills/${id}`)
  },

  // Subscriptions (Assinaturas e Rateio)
  getSubscriptions: async () => {
    return api.get('/subscriptions')
  },

  createSubscription: async (data: {
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
    return api.post('/subscriptions', data)
  },

  updateSubscription: async (id: number, data: any) => {
    return api.put(`/subscriptions/${id}`, data)
  },

  deleteSubscription: async (id: number) => {
    return api.delete(`/subscriptions/${id}`)
  },

  addSubscriptionMember: async (subscriptionId: number, data: { name: string; installment_amount: number; contact?: string | null }) => {
    return api.post(`/subscriptions/${subscriptionId}/members`, data)
  },

  removeSubscriptionMember: async (subscriptionId: number, memberId: number) => {
    return api.delete(`/subscriptions/${subscriptionId}/members/${memberId}`)
  },

  recordMemberPayment: async (
    subscriptionId: number,
    memberId: number,
    data: {
      reference_month: string
      status: 'paid' | 'pending'
      amount?: number
      payment_date?: string | null
    }
  ) => {
    return api.post(`/subscriptions/${subscriptionId}/members/${memberId}/payments`, data)
  },

  paySubscription: async (
    subscriptionId: number,
    data?: {
      amount?: number
      payment_date?: string
      bank_account_id?: number
      credit_card_id?: number
    }
  ) => {
    return api.post(`/subscriptions/${subscriptionId}/pay`, data || {})
  },

  unpaySubscription: async (
    subscriptionId: number,
    data?: {
      reference_month?: string
    }
  ) => {
    return api.post(`/subscriptions/${subscriptionId}/unpay`, data || {})
  },

  // Transactions
  getTransactions: async (params?: Record<string, any>) => {
    if (!params) return api.get('/transactions')
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    }
    const query = searchParams.toString()
    return api.get(`/transactions${query ? `?${query}` : ''}`)
  },

  createTransaction: async (data: {
    type: 'income' | 'expense'
    amount: number
    occurred_at: string
    status: 'paid' | 'pending'
    description: string
    bank_account_id?: number
    credit_card_id?: number
    category_id?: number
    is_installment?: boolean
    installments_count?: number
  }) => {
    return api.post('/transactions', data)
  },
}
