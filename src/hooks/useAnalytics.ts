import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface DateRange {
  from: string
  to: string
}

export interface IncomeExpenseData {
  month: string
  income: number
  expenses: number
  net: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactionCount: number
  color: string
}

export interface VendorStats {
  vendor: string
  amount: number
  transactionCount: number
}

export interface VATReport {
  totalSales: number
  totalPurchases: number
  inputVAT: number
  outputVAT: number
  vatBalance: number
  period: string
}

export interface MatchingStats {
  totalTransactions: number
  matched: number
  unmatched: number
  matchRate: number
  exactMatches: number
  partialMatches: number
  aiMatches: number
}

export interface CashFlowData {
  date: string
  income: number
  expense: number
  balance: number
}

export interface UseAnalyticsReturn {
  incomeExpenseData: IncomeExpenseData[]
  categoryBreakdown: CategoryBreakdown[]
  topVendors: VendorStats[]
  vatReport: VATReport | null
  matchingStats: MatchingStats | null
  cashFlow: CashFlowData[]
  loading: boolean
  error: Error | null
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  refetch: () => Promise<void>
}

// Helper function to format month name
function formatMonth(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Helper function to get month key
function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function useAnalytics(initialDateRange?: DateRange): UseAnalyticsReturn {
  const today = new Date()
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || {
      from: oneYearAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    }
  )

  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseData[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [topVendors, setTopVendors] = useState<VendorStats[]>([])
  const [vatReport, setVatReport] = useState<VATReport | null>(null)
  const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchIncomeExpenseData = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, direction')
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .in('direction', ['income', 'expense'])

    if (error) throw error

    // Group by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    data?.forEach((transaction: any) => {
      const monthKey = getMonthKey(transaction.date)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }

      if (transaction.direction === 'income') {
        monthlyData[monthKey].income += transaction.amount
      } else if (transaction.direction === 'expense') {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount)
      }
    })

    // Convert to array and sort by date
    const result: IncomeExpenseData[] = Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        month: formatMonth(monthKey + '-01'),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })

    setIncomeExpenseData(result)
  }

  const fetchCategoryBreakdown = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        amount,
        categories (
          name,
          color
        )
      `
      )
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .eq('direction', 'expense')

    if (error) throw error

    // Group by category
    const categoryData: Record<string, { amount: number; count: number; color: string }> = {}
    let totalAmount = 0

    data?.forEach((transaction: any) => {
      const categoryName = transaction.categories?.name || 'Uncategorized'
      const categoryColor = transaction.categories?.color || '#6b7280'
      const amount = Math.abs(transaction.amount)

      if (!categoryData[categoryName]) {
        categoryData[categoryName] = { amount: 0, count: 0, color: categoryColor }
      }

      categoryData[categoryName].amount += amount
      categoryData[categoryName].count += 1
      totalAmount += amount
    })

    // Convert to array and calculate percentages
    const result: CategoryBreakdown[] = Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        transactionCount: data.count,
        color: data.color,
      }))
      .sort((a, b) => b.amount - a.amount)

    setCategoryBreakdown(result)
  }

  const fetchTopVendors = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('source, amount')
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .eq('direction', 'expense')

    if (error) throw error

    // Group by vendor (source)
    const vendorData: Record<string, { amount: number; count: number }> = {}

    data?.forEach((transaction: any) => {
      const vendor = transaction.source || 'Unknown'
      const amount = Math.abs(transaction.amount)

      if (!vendorData[vendor]) {
        vendorData[vendor] = { amount: 0, count: 0 }
      }

      vendorData[vendor].amount += amount
      vendorData[vendor].count += 1
    })

    // Convert to array, sort by amount, and take top 10
    const result: VendorStats[] = Object.entries(vendorData)
      .map(([vendor, data]) => ({
        vendor,
        amount: data.amount,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    setTopVendors(result)
  }

  const fetchVATReport = async (userId: string) => {
    // Get all transactions with VAT
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, direction, vat_amount, has_vat')
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)

    if (txError) throw txError

    // Get all invoices with VAT
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('total_amount, vat_amount, has_vat')
      .eq('user_id', userId)
      .gte('document_date', dateRange.from)
      .lte('document_date', dateRange.to)

    if (invError) throw invError

    let totalSales = 0
    let totalPurchases = 0
    let outputVAT = 0 // VAT on sales
    let inputVAT = 0 // VAT on purchases

    // Calculate from transactions
    transactions?.forEach((tx: any) => {
      if (tx.direction === 'income') {
        totalSales += tx.amount
        if (tx.has_vat === 'yes') {
          outputVAT += tx.vat_amount
        }
      } else if (tx.direction === 'expense') {
        totalPurchases += Math.abs(tx.amount)
        if (tx.has_vat === 'yes') {
          inputVAT += tx.vat_amount
        }
      }
    })

    // Calculate from invoices
    invoices?.forEach((inv: any) => {
      if (inv.has_vat && inv.vat_amount > 0) {
        inputVAT += inv.vat_amount
        totalPurchases += inv.total_amount || 0
      }
    })

    const vatBalance = outputVAT - inputVAT

    setVatReport({
      totalSales,
      totalPurchases,
      inputVAT,
      outputVAT,
      vatBalance,
      period: `${dateRange.from} to ${dateRange.to}`,
    })
  }

  const fetchMatchingStats = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('match_quality, invoice_id')
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)

    if (error) throw error

    const totalTransactions = data?.length || 0
    let matched = 0
    let exactMatches = 0
    let partialMatches = 0
    let aiMatches = 0

    data?.forEach((tx: any) => {
      if (tx.invoice_id) {
        matched++

        if (tx.match_quality === 'exact') {
          exactMatches++
        } else if (
          tx.match_quality === 'partial_amount' ||
          tx.match_quality === 'partial_date'
        ) {
          partialMatches++
        } else if (tx.match_quality === 'ai_matched') {
          aiMatches++
        }
      }
    })

    const unmatched = totalTransactions - matched
    const matchRate = totalTransactions > 0 ? (matched / totalTransactions) * 100 : 0

    setMatchingStats({
      totalTransactions,
      matched,
      unmatched,
      matchRate,
      exactMatches,
      partialMatches,
      aiMatches,
    })
  }

  const fetchCashFlow = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, direction')
      .eq('user_id', userId)
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .in('direction', ['income', 'expense'])
      .order('date', { ascending: true })

    if (error) throw error

    // Group by date and calculate running balance
    const dailyData: Record<string, { income: number; expense: number }> = {}

    data?.forEach((transaction: any) => {
      const date = transaction.date
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0 }
      }

      if (transaction.direction === 'income') {
        dailyData[date].income += transaction.amount
      } else if (transaction.direction === 'expense') {
        dailyData[date].expense += Math.abs(transaction.amount)
      }
    })

    // Convert to array with running balance
    let runningBalance = 0
    const result: CashFlowData[] = Object.entries(dailyData)
      .map(([date, data]) => {
        runningBalance += data.income - data.expense
        return {
          date,
          income: data.income,
          expense: data.expense,
          balance: runningBalance,
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setCashFlow(result)
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await Promise.all([
        fetchIncomeExpenseData(user.id),
        fetchCategoryBreakdown(user.id),
        fetchTopVendors(user.id),
        fetchVATReport(user.id),
        fetchMatchingStats(user.id),
        fetchCashFlow(user.id),
      ])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [dateRange.from, dateRange.to])

  return {
    incomeExpenseData,
    categoryBreakdown,
    topVendors,
    vatReport,
    matchingStats,
    cashFlow,
    loading,
    error,
    dateRange,
    setDateRange,
    refetch: fetchAllData,
  }
}
