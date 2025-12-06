/**
 * TransactionMatchBadge Component
 * Visual indicator for transaction match status with color coding
 */

import type { Database } from '../types/database'

type MatchQuality = Database['public']['Tables']['transactions']['Row']['match_quality']

interface TransactionMatchBadgeProps {
  matchQuality: MatchQuality
  className?: string
  showLabel?: boolean
}

export default function TransactionMatchBadge({
  matchQuality,
  className = '',
  showLabel = true
}: TransactionMatchBadgeProps) {
  if (!matchQuality) {
    return showLabel ? (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-500/20 border-gray-500/50 text-gray-400 ${className}`}>
        Unmatched
      </span>
    ) : null
  }

  const getBadgeStyles = () => {
    switch (matchQuality) {
      case 'exact':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          text: 'text-green-400',
          label: 'Exact Match',
          icon: '✓'
        }
      case 'partial_amount':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          label: 'Partial Match',
          icon: '~'
        }
      case 'partial_date':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          label: 'Date Match',
          icon: '📅'
        }
      case 'ai_matched':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          label: 'AI Match',
          icon: '🤖'
        }
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/50',
          text: 'text-gray-400',
          label: 'Unknown',
          icon: '?'
        }
    }
  }

  const styles = getBadgeStyles()

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles.bg} ${styles.border} ${styles.text} ${className}`}
      title={styles.label}
    >
      {showLabel ? styles.label : styles.icon}
    </span>
  )
}

/**
 * Dot indicator for compact display
 */
export function MatchStatusDot({ matchQuality }: { matchQuality: MatchQuality }) {
  const getColor = () => {
    switch (matchQuality) {
      case 'exact':
        return 'bg-green-500'
      case 'partial_amount':
      case 'partial_date':
        return 'bg-yellow-500'
      case 'ai_matched':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${getColor()}`}
      title={matchQuality || 'Unmatched'}
    />
  )
}
