import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ScissorsIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import TransactionFilters from '../components/TransactionFilters'
import TransactionEditModal from '../components/TransactionEditModal'
import TransactionSplitModal from '../components/TransactionSplitModal'
import InvoiceLinkPicker from '../components/InvoiceLinkPicker'
import FileBrowser from '../components/FileBrowser'
import { SidebarNavigationSlim } from '../components/application/app-navigation/sidebar-navigation/sidebar-slim'
import type { NavItemType } from '../components/application/app-navigation/config'
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import type { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

const navItems: NavItemType[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { label: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon },
  { label: 'Matching', href: '/matching', icon: DocumentTextIcon },
  { label: 'Reports', href: '/reports', icon: ChartBarIcon },
]

export default function Transactions() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const {
    transactions,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    setPage,
    filters,
    setFilters,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    splitTransaction,
    linkInvoice,
  } = useTransactions()

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null)
  const [linkingTransaction, setLinkingTransaction] = useState<Transaction | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(transactions.map(t => t.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    if (!confirm(`Delete ${selectedRows.size} transactions?`)) return

    try {
      await deleteTransactions(Array.from(selectedRows))
      setSelectedRows(new Set())
    } catch (err) {
      console.error('Error deleting transactions:', err)
    }
  }

  const handleExport = () => {
    // Convert transactions to CSV
    const headers = ['Date', 'Source', 'Description', 'Amount', 'Currency', 'Direction', 'Category', 'Business', 'VAT', 'Notes']
    const rows = transactions.map(t => [
      t.date,
      t.source,
      t.description || '',
      t.amount.toString(),
      t.currency,
      t.direction,
      t.category_id || '',
      t.business_id || '',
      t.has_vat === 'yes' ? t.vat_amount.toString() : '',
      t.notes || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'income':
        return 'text-green-400'
      case 'expense':
        return 'text-red-400'
      case 'transfer':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <SidebarNavigationSlim
        items={navItems}
        footerItems={[
          { label: 'Support', href: '/support', icon: LifebuoyIcon },
          { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <BanknotesIcon className="h-6 w-6 text-green-500 mr-3" />
                <h1 className="text-xl font-semibold text-white">Transactions</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFileBrowser(!showFileBrowser)}
                  className="inline-flex items-center px-3 py-2 border border-gray-700 text-sm font-medium rounded-lg text-white hover:bg-gray-800 transition-colors"
                >
                  {showFileBrowser ? (
                    <TableCellsIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <Squares2X2Icon className="h-5 w-5 mr-2" />
                  )}
                  {showFileBrowser ? 'Hide Files' : 'Show Files'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-black bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-6">
              {/* Main Content */}
              <div className={showFileBrowser ? 'flex-1' : 'w-full'}>
                {/* Filters */}
                <div className="mb-6">
                  <TransactionFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={() => setFilters({})}
                  />
                </div>

                {/* Actions Bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedRows.size > 0 && (
                      <>
                        <span className="text-sm text-gray-400">
                          {selectedRows.size} selected
                        </span>
                        <button
                          onClick={handleBulkDelete}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>

                {/* Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : error ? (
                    <div className="p-6 text-center">
                      <p className="text-red-400">{error.message}</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <BanknotesIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No transactions found</p>
                      <p className="text-gray-600 text-xs mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-black/50 border-b border-gray-800 sticky top-0">
                            <tr>
                              <th className="w-12 px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.size === transactions.length}
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  className="rounded border-gray-700 bg-black text-green-500 focus:ring-green-500"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Source
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Direction
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Invoice
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                VAT
                              </th>
                              <th className="w-12 px-4 py-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {transactions.map((transaction) => (
                              <tr
                                key={transaction.id}
                                className="hover:bg-black/50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.has(transaction.id)}
                                    onChange={(e) => handleSelectRow(transaction.id, e.target.checked)}
                                    className="rounded border-gray-700 bg-black text-green-500 focus:ring-green-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {transaction.source}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                                  {transaction.description || '-'}
                                </td>
                                <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${getDirectionColor(transaction.direction)}`}>
                                  {transaction.currency} {transaction.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                    transaction.direction === 'income'
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : transaction.direction === 'expense'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : transaction.direction === 'transfer'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                  }`}>
                                    {transaction.direction}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {transaction.invoice_id ? (
                                    <DocumentTextIcon className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <span className="text-gray-600 text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {transaction.has_vat === 'yes' ? (
                                    <span className="text-xs text-green-400">
                                      {transaction.vat_amount.toFixed(2)}
                                    </span>
                                  ) : transaction.has_vat === 'no' ? (
                                    <span className="text-xs text-gray-600">No</span>
                                  ) : (
                                    <span className="text-xs text-gray-600">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 relative">
                                  <button
                                    onClick={() => setActiveDropdown(activeDropdown === transaction.id ? null : transaction.id)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                  </button>
                                  {activeDropdown === transaction.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                                      <button
                                        onClick={() => {
                                          setEditingTransaction(transaction)
                                          setActiveDropdown(null)
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSplittingTransaction(transaction)
                                          setActiveDropdown(null)
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                                      >
                                        <ScissorsIcon className="h-4 w-4" />
                                        Split
                                      </button>
                                      <button
                                        onClick={() => {
                                          setLinkingTransaction(transaction)
                                          setActiveDropdown(null)
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                                      >
                                        <LinkIcon className="h-4 w-4" />
                                        Link Invoice
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm('Delete this transaction?')) {
                                            await deleteTransaction(transaction.id)
                                          }
                                          setActiveDropdown(null)
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between bg-black/50">
                        <div className="text-sm text-gray-400">
                          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} transactions
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <span className="text-sm text-white">
                            Page {page} of {totalPages}
                          </span>
                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Browser Sidebar */}
              {showFileBrowser && (
                <div className="w-80 flex-shrink-0">
                  <FileBrowser />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {editingTransaction && (
        <TransactionEditModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          onSave={updateTransaction}
        />
      )}

      {splittingTransaction && (
        <TransactionSplitModal
          isOpen={!!splittingTransaction}
          onClose={() => setSplittingTransaction(null)}
          transaction={splittingTransaction}
          onSplit={splitTransaction}
        />
      )}

      {linkingTransaction && (
        <InvoiceLinkPicker
          isOpen={!!linkingTransaction}
          onClose={() => setLinkingTransaction(null)}
          onLink={async (invoiceId) => {
            if (linkingTransaction) {
              await linkInvoice(linkingTransaction.id, invoiceId)
              setLinkingTransaction(null)
            }
          }}
        />
      )}
    </div>
  )
}
