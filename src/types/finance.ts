export interface BankAccount {
  id: number
  workspace_id?: number
  bank_name: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'cash' | 'other'
  current_balance: number
  color_hex: string
  is_active: boolean
  badge: 'DEBIT' | 'CREDIT' | 'INVEST' | 'WALLET'
  account_number?: string
  daily_limit?: number
  limit_used_percentage?: number
}

export interface CreditCard {
  id: number
  workspace_id?: number
  bank_account_id?: number
  bank_account?: { id: number; name: string; color_hex?: string } | null
  name: string
  type?: 'credit' | 'debit'
  total_limit: number
  daily_limit?: number
  available_limit: number
  used_limit?: number
  used_percentage?: number
  closing_day: number
  due_day: number
  brand: string
  color_hex: string
  is_active: boolean
  badge: 'CREDIT' | 'DEBIT'
  card_last_digits?: string
}

export interface MonthlyCardLimit {
  month_year: string
  month_name: string
  due_date: string
  invoice_amount: number
  blocked_limit: number
  available_limit: number
  utilization_percentage: number
}

export interface FixedBillPayment {
  id: number
  amount: number
  occurred_at: string
  reference_month: string
  status: string
  bank_account_id?: number | null
  credit_card_id?: number | null
}

export interface FixedBill {
  id: number
  workspace_id?: number
  name: string
  color_hex?: string
  icon_type?: string
  type: 'expense' | 'income'
  estimated_amount: number
  due_day: number
  category_id?: number | null
  preferred_bank_account_id?: number | null
  preferred_bank_account?: BankAccount | null
  category?: { id: number; name: string; color_hex?: string; icon?: string } | null
  is_active: boolean
  is_reminder_active: boolean
  reminder_days_before?: number
  notes?: string | null
  status: 'urgent' | 'pending' | 'scheduled' | 'paid'
  status_text: string
  is_paid?: boolean
  current_payment?: FixedBillPayment | null
  payments?: FixedBillPayment[]
}

export interface SubscriptionPayment {
  id: number
  subscription_member_id: number
  reference_month: string
  amount: number
  status: 'paid' | 'pending'
  payment_date?: string | null
}

export interface SubscriptionMember {
  id: number
  subscription_id?: number
  name: string
  contact?: string | null
  initials: string
  avatar_color?: string
  installment_amount: number
  is_paid: boolean
  payments?: SubscriptionPayment[]
}

export interface Subscription {
  id: number
  workspace_id?: number
  service_name: string
  color_hex?: string
  icon_type: string
  icon_bg: string
  total_amount: number
  billing_day: number
  due_text: string
  category_id?: number | null
  category_name?: string
  credit_card_id?: number | null
  bank_account_id?: number | null
  credit_card?: { id: number; name: string; brand?: string; color_hex?: string; type?: 'credit' | 'debit' } | null
  bank_account?: { id: number; name: string; color_hex?: string } | null
  is_active?: boolean
  notes?: string | null
  members: SubscriptionMember[]
  paid_count: number
  total_members: number
  is_family: boolean
}

export interface QuarterlyMonth {
  month: string
  income: number
  expenses: number
}

export interface DashboardSummary {
  total_balance: number
  balance_period: string
  monthly_income: number
  monthly_expenses: number
  user_name: string
  greeting_subtitle: string
}

export interface TransactionMutation {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  occurred_at: string
  bank_account_id?: number
  credit_card_id?: number
  category_id?: number
  category?: string
  is_installment?: boolean
  installments_count?: number
  timestamp: number
  synced: boolean
}

export interface TransactionItem {
  id: number
  workspace_id?: number
  type: 'income' | 'expense'
  amount: number
  occurred_at: string
  status: 'paid' | 'pending' | 'cancelled'
  description: string
  bank_account_id?: number | null
  credit_card_id?: number | null
  category_id?: number | null
  installment_number?: number | null
  total_installments?: number | null
  installment_group_id?: string | null
  bank_account?: { id: number; name: string; color_hex?: string } | null
  credit_card?: { id: number; name: string; brand?: string; color_hex?: string; type?: 'credit' | 'debit' } | null
  category?: { id: number; name: string; icon?: string; color_hex?: string } | null
  notes?: string | null
  created_at?: string
}
