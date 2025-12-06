import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  DocumentArrowDownIcon,
  PrinterIcon,
  CalendarIcon,
  ChartBarIcon,
  HomeIcon,
  BanknotesIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useAnalytics } from '../hooks/useAnalytics'
import { useAuth } from '../hooks/useAuth'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Color scheme
const COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  transfer: '#3b82f6',
  vat: '#f59e0b',
  text: '#9ca3af',
  grid: '#374151',
  background: '#111111',
}

// Category colors for pie chart
const CATEGORY_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

interface DatePreset {
  label: string
  from: string
  to: string
}

function getDatePresets(): DatePreset[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()

  return [
    {
      label: 'Today',
      from: new Date(year, month, day).toISOString().split('T')[0],
      to: new Date(year, month, day).toISOString().split('T')[0],
    },
    {
      label: 'This Week',
      from: new Date(year, month, day - today.getDay()).toISOString().split('T')[0],
      to: new Date(year, month, day).toISOString().split('T')[0],
    },
    {
      label: 'This Month',
      from: new Date(year, month, 1).toISOString().split('T')[0],
      to: new Date(year, month + 1, 0).toISOString().split('T')[0],
    },
    {
      label: 'This Quarter',
      from: new Date(year, Math.floor(month / 3) * 3, 1).toISOString().split('T')[0],
      to: new Date(year, Math.floor(month / 3) * 3 + 3, 0).toISOString().split('T')[0],
    },
    {
      label: 'This Year',
      from: new Date(year, 0, 1).toISOString().split('T')[0],
      to: new Date(year, 11, 31).toISOString().split('T')[0],
    },
    {
      label: 'Last Month',
      from: new Date(year, month - 1, 1).toISOString().split('T')[0],
      to: new Date(year, month, 0).toISOString().split('T')[0],
    },
    {
      label: 'Last Quarter',
      from: new Date(year, Math.floor(month / 3) * 3 - 3, 1).toISOString().split('T')[0],
      to: new Date(year, Math.floor(month / 3) * 3, 0).toISOString().split('T')[0],
    },
    {
      label: 'Last Year',
      from: new Date(year - 1, 0, 1).toISOString().split('T')[0],
      to: new Date(year - 1, 11, 31).toISOString().split('T')[0],
    },
  ]
}

const navItems: NavItemType[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { label: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon },
  { label: 'Matching', href: '/matching', icon: SparklesIcon },
  { label: 'Reports', href: '/reports', icon: ChartPieIcon },
]

export default function Reports() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const {
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
  } = useAnalytics()

  const [selectedPreset, setSelectedPreset] = useState('This Year')

  const datePresets = getDatePresets()

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset.label)
    setDateRange({ from: preset.from, to: preset.to })
  }

  const handleCustomRange = (from: string, to: string) => {
    setDateRange({ from, to })
    setSelectedPreset('Custom Range')
  }

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const rows = data.map((obj) =>
      headers
        .map((key) => {
          const value = obj[key]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        })
        .join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Income vs Expenses sheet
    if (incomeExpenseData.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(incomeExpenseData)
      XLSX.utils.book_append_sheet(workbook, ws1, 'Income vs Expenses')
    }

    // Category Breakdown sheet
    if (categoryBreakdown.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(categoryBreakdown)
      XLSX.utils.book_append_sheet(workbook, ws2, 'Category Breakdown')
    }

    // Top Vendors sheet
    if (topVendors.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(topVendors)
      XLSX.utils.book_append_sheet(workbook, ws3, 'Top Vendors')
    }

    // VAT Report sheet
    if (vatReport) {
      const ws4 = XLSX.utils.json_to_sheet([vatReport])
      XLSX.utils.book_append_sheet(workbook, ws4, 'VAT Report')
    }

    // Matching Stats sheet
    if (matchingStats) {
      const ws5 = XLSX.utils.json_to_sheet([matchingStats])
      XLSX.utils.book_append_sheet(workbook, ws5, 'Matching Stats')
    }

    // Cash Flow sheet
    if (cashFlow.length > 0) {
      const ws6 = XLSX.utils.json_to_sheet(cashFlow)
      XLSX.utils.book_append_sheet(workbook, ws6, 'Cash Flow')
    }

    XLSX.writeFile(workbook, `InvoiceMatch-Report-${dateRange.from}-to-${dateRange.to}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    let yPos = 20

    // Title
    doc.setFontSize(20)
    doc.text('InvoiceMatch Financial Report', 14, yPos)
    yPos += 10

    doc.setFontSize(12)
    doc.text(`Period: ${dateRange.from} to ${dateRange.to}`, 14, yPos)
    yPos += 15

    // VAT Report
    if (vatReport) {
      doc.setFontSize(16)
      doc.text('VAT Report', 14, yPos)
      yPos += 7

      autoTable(doc, {
        head: [['Metric', 'Amount']],
        body: [
          ['Total Sales', `₪${vatReport.totalSales.toFixed(2)}`],
          ['Total Purchases', `₪${vatReport.totalPurchases.toFixed(2)}`],
          ['Output VAT', `₪${vatReport.outputVAT.toFixed(2)}`],
          ['Input VAT', `₪${vatReport.inputVAT.toFixed(2)}`],
          ['VAT Balance', `₪${vatReport.vatBalance.toFixed(2)}`],
        ],
        startY: yPos,
        theme: 'grid',
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Income vs Expenses
    if (incomeExpenseData.length > 0 && yPos < 250) {
      doc.setFontSize(16)
      doc.text('Income vs Expenses', 14, yPos)
      yPos += 7

      autoTable(doc, {
        head: [['Month', 'Income', 'Expenses', 'Net']],
        body: incomeExpenseData.map((item) => [
          item.month,
          `₪${item.income.toFixed(2)}`,
          `₪${item.expenses.toFixed(2)}`,
          `₪${item.net.toFixed(2)}`,
        ]),
        startY: yPos,
        theme: 'grid',
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Category Breakdown
    if (categoryBreakdown.length > 0) {
      doc.setFontSize(16)
      doc.text('Category Breakdown', 14, yPos)
      yPos += 7

      autoTable(doc, {
        head: [['Category', 'Amount', 'Percentage', 'Transactions']],
        body: categoryBreakdown.map((item) => [
          item.category,
          `₪${item.amount.toFixed(2)}`,
          `${item.percentage.toFixed(1)}%`,
          item.transactionCount.toString(),
        ]),
        startY: yPos,
        theme: 'grid',
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Top Vendors
    if (topVendors.length > 0) {
      doc.setFontSize(16)
      doc.text('Top Vendors', 14, yPos)
      yPos += 7

      autoTable(doc, {
        head: [['Vendor', 'Amount', 'Transactions']],
        body: topVendors.map((item) => [
          item.vendor,
          `₪${item.amount.toFixed(2)}`,
          item.transactionCount.toString(),
        ]),
        startY: yPos,
        theme: 'grid',
      })
    }

    doc.save(`InvoiceMatch-Report-${dateRange.from}-to-${dateRange.to}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Calculate summary stats
  const totalIncome = incomeExpenseData.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = incomeExpenseData.reduce((sum, item) => sum + item.expenses, 0)
  const netProfit = totalIncome - totalExpenses

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 text-xl">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error.message}</div>
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
                <h1 className="text-xl font-semibold text-white">Reports & Analytics</h1>
              </div>
              <div className="flex items-center">
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
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              {/* Export buttons */}
              <div className="flex gap-3 no-print ml-auto">
            <button
              onClick={() =>
                exportToCSV(
                  incomeExpenseData,
                  `income-expenses-${dateRange.from}-to-${dateRange.to}.csv`
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              Print
            </button>
          </div>
            </div>

            {/* Date Range Selector */}
        <div className="mb-8 bg-gray-900 rounded-xl p-6 no-print">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Date Range</h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetChange(preset)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPreset === preset.label
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">From</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleCustomRange(e.target.value, dateRange.to)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">To</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleCustomRange(dateRange.from, e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">Total Income</div>
            <div className="text-3xl font-bold text-green-500">₪{totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">Total Expenses</div>
            <div className="text-3xl font-bold text-red-500">₪{totalExpenses.toFixed(2)}</div>
          </div>
          <div
            className={`bg-gradient-to-br ${
              netProfit >= 0
                ? 'from-green-900/20 to-green-800/10 border-green-700/30'
                : 'from-red-900/20 to-red-800/10 border-red-700/30'
            } border rounded-xl p-6`}
          >
            <div className="text-sm text-gray-400 mb-2">Net Profit</div>
            <div
              className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              ₪{netProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Income vs Expenses Chart */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 print-page-break">
          <h2 className="text-xl font-semibold mb-6">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="month" stroke={COLORS.text} />
              <YAxis stroke={COLORS.text} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.grid}`,
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="income" fill={COLORS.income} name="Income" />
              <Bar dataKey="expenses" fill={COLORS.expense} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown Chart */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Expenses by Category</h2>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.category}: ${entry.percentage.toFixed(1)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.grid}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `₪${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </div>

          {/* Top Vendors Chart */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Top 10 Vendors</h2>
            {topVendors.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topVendors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis type="number" stroke={COLORS.text} />
                  <YAxis dataKey="vendor" type="category" width={120} stroke={COLORS.text} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.grid}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `₪${value.toFixed(2)}`}
                  />
                  <Bar dataKey="amount" fill={COLORS.expense} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No vendor data available
              </div>
            )}
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 print-page-break">
          <h2 className="text-xl font-semibold mb-6">Cash Flow</h2>
          {cashFlow.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" stroke={COLORS.text} />
                <YAxis stroke={COLORS.text} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.grid}`,
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `₪${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={COLORS.income}
                  strokeWidth={2}
                  name="Balance"
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={COLORS.transfer}
                  strokeWidth={2}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke={COLORS.expense}
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No cash flow data available
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* VAT Report */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">VAT Report</h2>
            {vatReport ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Total Sales</span>
                  <span className="text-lg font-semibold">₪{vatReport.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Total Purchases</span>
                  <span className="text-lg font-semibold">
                    ₪{vatReport.totalPurchases.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Output VAT (Sales)</span>
                  <span className="text-lg font-semibold text-green-500">
                    ₪{vatReport.outputVAT.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Input VAT (Purchases)</span>
                  <span className="text-lg font-semibold text-red-500">
                    ₪{vatReport.inputVAT.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-lg font-semibold">VAT Balance</span>
                  <span
                    className={`text-xl font-bold ${
                      vatReport.vatBalance >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    ₪{vatReport.vatBalance.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  {vatReport.vatBalance >= 0
                    ? 'Amount to pay to tax authority'
                    : 'Amount to receive from tax authority'}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No VAT data available
              </div>
            )}
          </div>

          {/* Matching Statistics */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Matching Statistics</h2>
            {matchingStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Total Transactions</span>
                  <span className="text-lg font-semibold">{matchingStats.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Matched</span>
                  <span className="text-lg font-semibold text-green-500">
                    {matchingStats.matched}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Unmatched</span>
                  <span className="text-lg font-semibold text-red-500">
                    {matchingStats.unmatched}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Match Rate</span>
                  <span className="text-lg font-semibold text-green-500">
                    {matchingStats.matchRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Exact Matches</span>
                  <span className="text-lg font-semibold">{matchingStats.exactMatches}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Partial Matches</span>
                  <span className="text-lg font-semibold">{matchingStats.partialMatches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">AI Matches</span>
                  <span className="text-lg font-semibold">{matchingStats.aiMatches}</span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No matching data available
              </div>
            )}
          </div>
        </div>
          </div>
        </main>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-page-break {
            page-break-after: always;
          }
          body {
            background: white;
            color: black;
          }
        }
      `}</style>
    </div>
  )
}
