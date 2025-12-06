/**
 * Matching Page
 * Interface for managing transaction-to-invoice matching
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  runAutoMatching,
  unmatchTransaction,
  getMatchStatistics,
  type MatchStatistics
} from '../lib/matching/matchingEngine'
import type { Database } from '../types/database'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'
import MatchingModal from '../components/MatchingModal'
import {
  ArrowPathIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  LinkIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarIcon,
  FunnelIcon,
  HomeIcon,
  CloudArrowUpIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  invoice_rows?: Array<Database['public']['Tables']['invoice_rows']['Row']>
}

const navItems: NavItemType[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { label: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon },
  { label: 'Matching', href: '/matching', icon: SparklesIcon },
  { label: 'Reports', href: '/reports', icon: ChartPieIcon },
]

export default function Matching() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<MatchStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoMatching, setAutoMatching] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filterStatus])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadTransactions(),
        loadInvoices(),
        loadStatistics()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    if (!user) return

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100)

    if (filterStatus === 'matched') {
      query = query.not('invoice_id', 'is', null)
    } else if (filterStatus === 'unmatched') {
      query = query.is('invoice_id', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading transactions:', error)
      return
    }

    setTransactions(data || [])
  }

  const loadInvoices = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_rows(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['unmatched', 'partially_matched'])
      .order('document_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error loading invoices:', error)
      return
    }

    setInvoices(data || [])
  }

  const loadStatistics = async () => {
    if (!user) return

    try {
      const statistics = await getMatchStatistics(user.id)
      setStats(statistics)
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const handleRunAutoMatching = async () => {
    if (!user) return

    setAutoMatching(true)
    setError(null)

    try {
      const results = await runAutoMatching(user.id)

      // Reload data
      await loadData()

      alert(`Auto-matching complete! ${results.length} matches created.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-matching failed')
    } finally {
      setAutoMatching(false)
    }
  }

  const handleManualMatch = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowMatchModal(true)
  }

  const handleUnmatch = async (transaction: Transaction) => {
    if (!confirm('Are you sure you want to unmatch this transaction?')) {
      return
    }

    try {
      await unmatchTransaction(transaction.id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unmatch transaction')
    }
  }

  const getMatchBadgeColor = (matchQuality: string | null) => {
    switch (matchQuality) {
      case 'exact':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'partial_amount':
      case 'partial_date':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'ai_matched':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  if (loading && !transactions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Loading matching data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNavigationSlim
        items={navItems}
        footerItems={[
          { label: 'Support', href: '/support', icon: LifebuoyIcon },
          { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white">Transaction Matching</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunAutoMatching}
                  disabled={autoMatching}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    autoMatching
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-black'
                  }`}
                >
                  {autoMatching ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                      Auto-Matching...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      Run Auto-Match
                    </>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <ChartBarIcon className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-400">{stats.matchRate}%</span>
              </div>
              <p className="text-sm text-gray-400">Match Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.matchedTransactions} of {stats.totalTransactions} matched
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-white">{stats.exactMatches}</span>
              </div>
              <p className="text-sm text-gray-400">Exact Matches</p>
              <p className="text-xs text-gray-500 mt-1">100% confidence</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-white">{stats.unmatchedTransactions}</span>
              </div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-xs text-gray-500 mt-1">Need review</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <BanknotesIcon className="h-5 w-5 text-green-500" />
                <span className="text-xl font-bold text-white">{formatCurrency(stats.totalMatchedAmount)}</span>
              </div>
              <p className="text-sm text-gray-400">Matched Amount</p>
              <p className="text-xs text-gray-500 mt-1">Total value matched</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('unmatched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'unmatched'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Unmatched
          </button>
          <button
            onClick={() => setFilterStatus('matched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'matched'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Matched
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transactions List */}
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Transactions</h2>
                <p className="text-xs text-gray-400 mt-1">{transactions.length} items</p>
              </div>
              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No transactions found</p>
                    <p className="text-xs text-gray-500 mt-1">Upload bank statements to get started</p>
                  </div>
                ) : (
                  transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="px-4 py-3 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-400">{formatDate(transaction.date)}</span>
                            {transaction.match_quality && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getMatchBadgeColor(transaction.match_quality)}`}
                              >
                                {transaction.match_quality === 'exact' ? 'Exact' :
                                 transaction.match_quality === 'partial_amount' ? 'Partial' :
                                 transaction.match_quality === 'partial_date' ? 'Date' :
                                 'AI'}
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium truncate mb-1">
                            {transaction.description || 'No description'}
                          </p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {transaction.invoice_id ? (
                          <button
                            onClick={() => handleUnmatch(transaction)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Unmatch
                          </button>
                        ) : (
                          <button
                            onClick={() => handleManualMatch(transaction)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Match
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Unmatched Invoices</h2>
                <p className="text-xs text-gray-400 mt-1">{invoices.length} items</p>
              </div>
              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                {invoices.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No unmatched invoices</p>
                    <p className="text-xs text-gray-500 mt-1">All invoices are matched or upload new ones</p>
                  </div>
                ) : (
                  invoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="px-4 py-3 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-white font-medium">
                            Invoice #{invoice.document_number || 'N/A'}
                          </span>
                        </div>
                        {invoice.vendor_name && (
                          <p className="text-sm text-gray-400">{invoice.vendor_name}</p>
                        )}
                        {invoice.document_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(invoice.document_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-white">
                          {invoice.total_amount ? formatCurrency(invoice.total_amount) : 'N/A'}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs ${
                          invoice.status === 'partially_matched'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {invoice.matched_transactions_count || 0} / {invoice.invoice_rows?.length || 0} matched
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
            </div>
          </div>
        </main>
      </div>

      {/* Matching Modal */}
      {selectedTransaction && (
        <MatchingModal
          transaction={selectedTransaction}
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false)
            setSelectedTransaction(null)
          }}
          onMatchCreated={loadData}
        />
      )}
    </div>
  )
}
