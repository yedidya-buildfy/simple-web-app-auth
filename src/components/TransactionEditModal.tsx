import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Business = Database['public']['Tables']['businesses']['Row']

interface TransactionEditModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>
}

export default function TransactionEditModal({
  isOpen,
  onClose,
  transaction,
  onSave,
}: TransactionEditModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])

  const [formData, setFormData] = useState({
    description: transaction.description || '',
    amount: transaction.amount.toString(),
    category_id: transaction.category_id || '',
    business_id: transaction.business_id || '',
    has_vat: transaction.has_vat,
    vat_amount: transaction.vat_amount.toString(),
    notes: transaction.notes || '',
  })

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
    // Reset form data when transaction changes
    setFormData({
      description: transaction.description || '',
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      business_id: transaction.business_id || '',
      has_vat: transaction.has_vat,
      vat_amount: transaction.vat_amount.toString(),
      notes: transaction.notes || '',
    })
    setError(null)
  }, [transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updates: Partial<Transaction> = {
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null,
        business_id: formData.business_id || null,
        has_vat: formData.has_vat,
        vat_amount: parseFloat(formData.vat_amount) || 0,
        notes: formData.notes || null,
      }

      await onSave(transaction.id, updates)
      onClose()
    } catch (err) {
      console.error('Error saving transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Edit Transaction
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Business
                      </label>
                      <select
                        value={formData.business_id}
                        onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                      >
                        <option value="">No Business</option>
                        {businesses.map(business => (
                          <option key={business.id} value={business.id}>
                            {business.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Has VAT */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Has VAT
                      </label>
                      <select
                        value={formData.has_vat}
                        onChange={(e) => setFormData({ ...formData, has_vat: e.target.value as 'yes' | 'no' | 'N/A' })}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                      >
                        <option value="N/A">N/A</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    {/* VAT Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        VAT Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.vat_amount}
                        onChange={(e) => setFormData({ ...formData, vat_amount: e.target.value })}
                        disabled={formData.has_vat !== 'yes'}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none"
                      placeholder="Add notes..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-black bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
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
