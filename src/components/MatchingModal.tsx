/**
 * MatchingModal Component
 * Manual matching interface for linking transactions to invoice rows
 */

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, DocumentTextIcon, CalendarIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { findPotentialMatches, createMatch, type PotentialMatch, type MatchQuality } from '../lib/matching/matchingEngine'
import type { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

interface MatchingModalProps {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onMatchCreated?: () => void
}

export default function MatchingModal({
  transaction,
  isOpen,
  onClose,
  onMatchCreated
}: MatchingModalProps) {
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && transaction) {
      loadPotentialMatches()
    }
  }, [isOpen, transaction])

  const loadPotentialMatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const matches = await findPotentialMatches(transaction.id)
      setPotentialMatches(matches)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async () => {
    if (!selectedMatch) return

    setCreating(true)
    setError(null)

    try {
      // Determine match quality based on score
      let matchQuality: MatchQuality
      if (selectedMatch.matchScore === 100) {
        matchQuality = 'exact'
      } else if (selectedMatch.matchScore >= 80) {
        matchQuality = 'partial_amount'
      } else {
        matchQuality = 'partial_date'
      }

      await createMatch(transaction.id, selectedMatch.invoiceRow.id, matchQuality)

      onMatchCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match')
    } finally {
      setCreating(false)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Match Transaction</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Transaction Details */}
            <div className="mb-6 p-4 bg-black/50 rounded-lg border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Transaction</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    Date
                  </div>
                  <p className="text-white font-medium">{formatDate(transaction.date)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <BanknotesIcon className="h-4 w-4" />
                    Amount
                  </div>
                  <p className="text-white font-medium">{formatCurrency(transaction.amount)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <DocumentTextIcon className="h-4 w-4" />
                    Description
                  </div>
                  <p className="text-white font-medium truncate">{transaction.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Potential Matches */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Potential Matches ({potentialMatches.length})
              </h3>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  <p className="mt-3 text-gray-400 text-sm">Finding matches...</p>
                </div>
              ) : potentialMatches.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No potential matches found</p>
                  <p className="text-gray-500 text-xs mt-1">Try adjusting the transaction details</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {potentialMatches.map((match, index) => (
                    <button
                      key={match.invoiceRow.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedMatch?.invoiceRow.id === match.invoiceRow.id
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-black/30 border-gray-800 hover:border-green-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium">
                              Invoice #{match.invoice.document_number || 'N/A'}
                            </h4>
                            {match.invoice.vendor_name && (
                              <>
                                <span className="text-gray-600">-</span>
                                <span className="text-gray-400 text-sm">{match.invoice.vendor_name}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">
                              {match.invoiceRow.date ? formatDate(match.invoiceRow.date) : 'No date'}
                            </span>
                            <span className="text-gray-600">|</span>
                            <span className="text-white font-medium">
                              {formatCurrency(match.invoiceRow.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              match.matchScore >= 90 ? 'text-green-400' :
                              match.matchScore >= 70 ? 'text-yellow-400' :
                              'text-orange-400'
                            }`}>
                              {match.matchScore}%
                            </div>
                            <div className="text-xs text-gray-500">score</div>
                          </div>
                          {selectedMatch?.invoiceRow.id === match.invoiceRow.id && (
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                      </div>

                      {/* Match Reasons */}
                      {match.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {match.matchReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Invoice Row Description */}
                      {match.invoiceRow.description && (
                        <div className="mt-2 text-xs text-gray-500">
                          {match.invoiceRow.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMatch}
              disabled={!selectedMatch || creating}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedMatch && !creating
                  ? 'bg-green-500 hover:bg-green-600 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                  Creating Match...
                </span>
              ) : (
                'Confirm Match'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
