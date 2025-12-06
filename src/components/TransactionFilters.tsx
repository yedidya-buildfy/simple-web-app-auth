import { useState, useEffect } from 'react'
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import type { TransactionFilters as Filters } from '../hooks/useTransactions'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../types/database'

type Category = Database['public']['Tables']['categories']['Row']
type Business = Database['public']['Tables']['businesses']['Row']

interface TransactionFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onReset: () => void
}

export default function TransactionFilters({
  filters,
  onFiltersChange,
  onReset,
}: TransactionFiltersProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [sources, setSources] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    const fetchFilterOptions = async () => {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (categoriesData) setCategories(categoriesData)

      // Fetch businesses
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (businessesData) setBusinesses(businessesData)

      // Fetch unique sources
      const { data: sourcesData } = await supabase
        .from('transactions')
        .select('source')
        .eq('user_id', user.id)

      if (sourcesData && sourcesData.length > 0) {
        const uniqueSources = [...new Set((sourcesData as { source: string }[]).map(t => t.source))]
        setSources(uniqueSources.sort())
      }
    }

    fetchFilterOptions()
  }, [user])

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Filter Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-green-500" />
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Search Description
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Direction
          </label>
          <select
            value={filters.direction || ''}
            onChange={(e) => handleFilterChange('direction', e.target.value)}
            className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
            <option value="credit_detail">Credit Detail</option>
          </select>
        </div>
      </div>

      {/* Extended Filters - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-800 pt-4">
          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Source
            </label>
            <select
              value={filters.source || ''}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Business */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Business
            </label>
            <select
              value={filters.businessId || ''}
              onChange={(e) => handleFilterChange('businessId', e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">All Businesses</option>
              {businesses.map(business => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Currency
            </label>
            <select
              value={filters.currency || ''}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">All Currencies</option>
              <option value="ILS">ILS (₪)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          {/* Amount Min */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Min Amount
            </label>
            <input
              type="number"
              value={filters.amountMin || ''}
              onChange={(e) => handleFilterChange('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            />
          </div>

          {/* Amount Max */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Max Amount
            </label>
            <input
              type="number"
              value={filters.amountMax || ''}
              onChange={(e) => handleFilterChange('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            />
          </div>

          {/* Has Invoice */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Has Invoice
            </label>
            <select
              value={filters.hasInvoice === undefined ? '' : filters.hasInvoice ? 'yes' : 'no'}
              onChange={(e) => handleFilterChange('hasInvoice', e.target.value === '' ? undefined : e.target.value === 'yes')}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Has VAT */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Has VAT
            </label>
            <select
              value={filters.hasVAT || ''}
              onChange={(e) => handleFilterChange('hasVAT', e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
