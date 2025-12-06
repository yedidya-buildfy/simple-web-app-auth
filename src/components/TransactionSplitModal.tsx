import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../types/database'
import type { Split } from '../hooks/useTransactions'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Business = Database['public']['Tables']['businesses']['Row']

interface TransactionSplitModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  onSplit: (id: string, splits: Split[]) => Promise<void>
}

interface SplitRow extends Split {
  id: string
}

export default function TransactionSplitModal({
  isOpen,
  onClose,
  transaction,
  onSplit,
}: TransactionSplitModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [splits, setSplits] = useState<SplitRow[]>([
    {
      id: '1',
      amount: 0,
      category_id: transaction.category_id || undefined,
      business_id: transaction.business_id || undefined,
      description: transaction.description || undefined,
      has_vat: transaction.has_vat,
      vat_amount: 0,
    },
    {
      id: '2',
      amount: 0,
      category_id: transaction.category_id || undefined,
      business_id: transaction.business_id || undefined,
      description: transaction.description || undefined,
      has_vat: transaction.has_vat,
      vat_amount: 0,
    },
  ])

  useEffect(() => {
    if (!user) return

    const fetchOptions = async () => {
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
    }

    fetchOptions()
  }, [user])

  useEffect(() => {
    // Reset splits when transaction changes
    setSplits([
      {
        id: '1',
        amount: 0,
        category_id: transaction.category_id || undefined,
        business_id: transaction.business_id || undefined,
        description: transaction.description || undefined,
        has_vat: transaction.has_vat,
        vat_amount: 0,
      },
      {
        id: '2',
        amount: 0,
        category_id: transaction.category_id || undefined,
        business_id: transaction.business_id || undefined,
        description: transaction.description || undefined,
        has_vat: transaction.has_vat,
        vat_amount: 0,
      },
    ])
    setError(null)
  }, [transaction])

  const addSplit = () => {
    setSplits([
      ...splits,
      {
        id: Date.now().toString(),
        amount: 0,
        category_id: transaction.category_id || undefined,
        business_id: transaction.business_id || undefined,
        description: transaction.description || undefined,
        has_vat: transaction.has_vat,
        vat_amount: 0,
      },
    ])
  }

  const removeSplit = (id: string) => {
    if (splits.length <= 2) {
      setError('You must have at least 2 splits')
      return
    }
    setSplits(splits.filter(s => s.id !== id))
  }

  const updateSplit = (id: string, updates: Partial<SplitRow>) => {
    setSplits(splits.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const totalSplitAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0)
  const difference = transaction.amount - totalSplitAmount
  const isValid = Math.abs(difference) < 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!isValid) {
      setError(`Split amounts must equal original transaction amount. Difference: ${difference.toFixed(2)}`)
      setLoading(false)
      return
    }

    try {
      // Remove id from splits before sending
      const cleanSplits = splits.map(({ id, ...split }) => split)
      await onSplit(transaction.id, cleanSplits)
      onClose()
    } catch (err) {
      console.error('Error splitting transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to split transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-white">
                      Split Transaction
                    </Dialog.Title>
                    <p className="text-sm text-gray-400 mt-1">
                      Original Amount: {transaction.currency} {transaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Splits */}
                  <div className="space-y-4 mb-4">
                    {splits.map((split, index) => (
                      <div
                        key={split.id}
                        className="bg-black/50 border border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-white">
                            Split {index + 1}
                          </h4>
                          {splits.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeSplit(split.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Description */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={split.description || ''}
                              onChange={(e) => updateSplit(split.id, { description: e.target.value })}
                              className="w-full px-3 py-2 bg-black border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            />
                          </div>

                          {/* Amount */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Amount *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={split.amount || ''}
                              onChange={(e) => updateSplit(split.id, { amount: parseFloat(e.target.value) || 0 })}
                              required
                              className="w-full px-3 py-2 bg-black border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Category
                            </label>
                            <select
                              value={split.category_id || ''}
                              onChange={(e) => updateSplit(split.id, { category_id: e.target.value || undefined })}
                              className="w-full px-3 py-2 bg-black border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            >
                              <option value="">No Category</option>
                              {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Business */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Business
                            </label>
                            <select
                              value={split.business_id || ''}
                              onChange={(e) => updateSplit(split.id, { business_id: e.target.value || undefined })}
                              className="w-full px-3 py-2 bg-black border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            >
                              <option value="">No Business</option>
                              {businesses.map(business => (
                                <option key={business.id} value={business.id}>
                                  {business.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Has VAT */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Has VAT
                            </label>
                            <select
                              value={split.has_vat || 'N/A'}
                              onChange={(e) => updateSplit(split.id, { has_vat: e.target.value as 'yes' | 'no' | 'N/A' })}
                              className="w-full px-3 py-2 bg-black border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            >
                              <option value="N/A">N/A</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Split Button */}
                  <button
                    type="button"
                    onClick={addSplit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-400 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Split
                  </button>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-black/50 border border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Original Amount:</span>
                      <span className="text-sm font-medium text-white">
                        {transaction.currency} {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Splits:</span>
                      <span className="text-sm font-medium text-white">
                        {transaction.currency} {totalSplitAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-sm text-gray-400">Difference:</span>
                      <span className={`text-sm font-medium ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.currency} {difference.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !isValid}
                      className="px-4 py-2 text-sm font-medium text-black bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Splitting...' : 'Split Transaction'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
