import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

export interface DashboardStats {
  totalTransactions: number
  totalInvoices: number
  pendingMatches: number
  recentFiles: Database['public']['Tables']['files']['Row'][]
  totalAmountMatched: number
  totalVAT: number
  matchedInvoices: number
  unmatchedInvoices: number
  totalExpenses: number
  totalIncome: number
  loading: boolean
  error: Error | null
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalInvoices: 0,
    pendingMatches: 0,
    recentFiles: [],
    totalAmountMatched: 0,
    totalVAT: 0,
    matchedInvoices: 0,
    unmatchedInvoices: 0,
    totalExpenses: 0,
    totalIncome: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        // Fetch total transactions count
        const { count: transactionsCount, error: transactionsError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (transactionsError) throw transactionsError

        // Fetch total invoices count and status breakdown
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('status, total_amount, vat_amount')
          .eq('user_id', user.id)
          .returns<Array<{ status: string; total_amount: number | null; vat_amount: number }>>()

        if (invoicesError) throw invoicesError

        const totalInvoices = invoicesData?.length || 0
        const pendingMatches = invoicesData?.filter(
          inv => inv.status === 'pending' || inv.status === 'unmatched'
        ).length || 0
        const matchedInvoices = invoicesData?.filter(
          inv => inv.status === 'matched' || inv.status === 'partially_matched'
        ).length || 0
        const unmatchedInvoices = invoicesData?.filter(
          inv => inv.status === 'unmatched' || inv.status === 'pending'
        ).length || 0

        // Calculate total VAT from invoices
        const totalVAT = invoicesData?.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0) || 0

        // Calculate total matched amount (from matched/partially matched invoices)
        const totalAmountMatched = invoicesData
          ?.filter(inv => inv.status === 'matched' || inv.status === 'partially_matched')
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

        // Fetch recent files (last 5)
        const { data: recentFiles, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (filesError) throw filesError

        // Fetch transaction amounts for income/expense breakdown
        const { data: transactionsData, error: transAmountsError } = await supabase
          .from('transactions')
          .select('direction, amount')
          .eq('user_id', user.id)
          .returns<Array<{ direction: string; amount: number }>>()

        if (transAmountsError) throw transAmountsError

        const totalExpenses = transactionsData
          ?.filter(t => t.direction === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) || 0

        const totalIncome = transactionsData
          ?.filter(t => t.direction === 'income')
          .reduce((sum, t) => sum + t.amount, 0) || 0

        setStats({
          totalTransactions: transactionsCount || 0,
          totalInvoices,
          pendingMatches,
          recentFiles: recentFiles || [],
          totalAmountMatched,
          totalVAT,
          matchedInvoices,
          unmatchedInvoices,
          totalExpenses,
          totalIncome,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }))
      }
    }

    fetchDashboardStats()
  }, [])

  return stats
}
