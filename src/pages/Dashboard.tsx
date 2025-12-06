import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  RectangleStackIcon,
  InboxIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  BellIcon,
  PresentationChartLineIcon,
  StarIcon,
  ClockIcon,
  UserCircleIcon,
  UserIcon,
  UsersIcon,
  UserPlusIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ClockIcon as ClockIconOutline,
  CloudArrowUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'
import { useDashboardStats } from '../hooks/useDashboardStats'
import CountUp from '@/components/CountUp'

const navItemsDualTier: NavItemType[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: BanknotesIcon,
  },
  {
    label: 'Upload Files',
    href: '/upload',
    icon: CloudArrowUpIcon,
  },
  {
    label: 'Matching',
    href: '/matching',
    icon: SparklesIcon,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: ChartPieIcon,
  },
]

function DashboardContent({ user }: { user: any }) {
  const stats = useDashboardStats()
  const gridRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  if (stats.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (stats.error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md">
            <p className="text-red-400">Error loading dashboard data</p>
            <p className="text-sm text-gray-400 mt-2">{stats.error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow-xl rounded-lg">
        <div className="px-6 py-5">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'User'}!
          </h2>
          <p className="text-gray-400">Here's what's happening with your invoices today.</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div ref={gridRef} className="bento-section">
        <style>
          {`
            .bento-section {
              --glow-color: 16, 185, 129;
              --border-color: #1f2937;
              --background-dark: #0a0a0a;
            }

            .bento-card {
              position: relative;
              background: #0a0a0a;
              border: 1px solid #1f2937;
              border-radius: 20px;
              padding: 1.5rem;
              overflow: hidden;
              transition: all 0.3s ease;
            }

            .bento-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 30px rgba(16, 185, 129, 0.15);
              border-color: rgba(16, 185, 129, 0.5);
            }

            .bento-card::after {
              content: '';
              position: absolute;
              inset: 0;
              padding: 2px;
              background: radial-gradient(
                400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(16, 185, 129, 0.6) 0%,
                rgba(16, 185, 129, 0.3) 30%,
                transparent 60%
              );
              border-radius: inherit;
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              mask-composite: exclude;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.3s ease;
              z-index: 1;
            }

            .bento-card:hover::after {
              opacity: 1;
            }

            .grid-bento {
              display: grid;
              gap: 1rem;
              grid-template-columns: repeat(1, 1fr);
            }

            @media (min-width: 768px) {
              .grid-bento {
                grid-template-columns: repeat(2, 1fr);
              }
            }

            @media (min-width: 1024px) {
              .grid-bento {
                grid-template-columns: repeat(3, 1fr);
              }

              .bento-card.span-2 {
                grid-column: span 2;
              }
            }

            .stat-icon {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .file-status-badge {
              display: inline-flex;
              align-items: center;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
            }

            .status-completed {
              background: rgba(16, 185, 129, 0.2);
              color: #10b981;
              border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .status-processing {
              background: rgba(59, 130, 246, 0.2);
              color: #3b82f6;
              border: 1px solid rgba(59, 130, 246, 0.3);
            }

            .status-error {
              background: rgba(239, 68, 68, 0.2);
              color: #ef4444;
              border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .status-pending {
              background: rgba(234, 179, 8, 0.2);
              color: #eab308;
              border: 1px solid rgba(234, 179, 8, 0.3);
            }
          `}
        </style>

        <div className="grid-bento">
          {/* Card 1: Total Transactions */}
          <div className="bento-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon">
                <DocumentTextIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Transactions</p>
              <div className="text-4xl font-bold text-white">
                <CountUp to={stats.totalTransactions} duration={1.5} />
              </div>
              <p className="text-xs text-gray-500 mt-2">All time bank transactions</p>
            </div>
          </div>

          {/* Card 2: Total Invoices */}
          <div className="bento-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon">
                <DocumentDuplicateIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Invoices</p>
              <div className="text-4xl font-bold text-white">
                <CountUp to={stats.totalInvoices} duration={1.5} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-green-400">
                  {stats.matchedInvoices} matched
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-yellow-400">
                  {stats.unmatchedInvoices} pending
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Matches */}
          <div className="bento-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon">
                <ClockIconOutline className="h-6 w-6 text-green-500" />
              </div>
              <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                Action Needed
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Pending Matches</p>
              <div className="text-4xl font-bold text-white">
                <CountUp to={stats.pendingMatches} duration={1.5} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Invoices waiting to be matched</p>
            </div>
          </div>

          {/* Card 4: Recent Files (spans 2 columns on desktop) */}
          <div className="bento-card span-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="stat-icon">
                  <CloudArrowUpIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Files</h3>
                  <p className="text-xs text-gray-400">Last 5 uploaded files</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {stats.recentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No files uploaded yet</p>
                  <p className="text-gray-600 text-xs mt-1">Upload your first bank statement or invoice</p>
                </div>
              ) : (
                stats.recentFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800 hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {file.source_type === 'bank' ? 'Bank Statement' : file.source_type === 'credit_card' ? 'Credit Card' : 'Invoice'}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`file-status-badge ${
                        file.status === 'completed'
                          ? 'status-completed'
                          : file.status === 'processing'
                          ? 'status-processing'
                          : file.status === 'error'
                          ? 'status-error'
                          : 'status-pending'
                      }`}
                    >
                      {file.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 5: Quick Stats */}
          <div className="bento-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon">
                <BanknotesIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Matched Amount</p>
                <div className="text-2xl font-bold text-white">
                  ₪<CountUp to={stats.totalAmountMatched} duration={1.5} separator="," />
                </div>
              </div>
              <div className="border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-400 mb-1">Total VAT</p>
                <div className="text-xl font-semibold text-green-400">
                  ₪<CountUp to={stats.totalVAT} duration={1.5} separator="," />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                <span className="text-gray-500">Income</span>
                <span className="text-green-400 font-medium">
                  ₪{stats.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Expenses</span>
                <span className="text-red-400 font-medium">
                  ₪{stats.totalExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: Quick Actions */}
          <div className="bento-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon">
                <SparklesIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <button
                onClick={() => navigate('/upload')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <CloudArrowUpIcon className="h-5 w-5" />
                Upload Bank Statement
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all border border-gray-700 hover:border-green-500/50"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
                Upload Invoice
              </button>
              <button
                onClick={() => navigate('/matching')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all border border-gray-700 hover:border-green-500/50"
              >
                <SparklesIcon className="h-5 w-5" />
                Run Matching
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Safety check: ProtectedRoute should prevent this, but double-check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <SidebarNavigationSlim
        items={navItemsDualTier}
        footerItems={[
          {
            label: 'Support',
            href: '/support',
            icon: LifebuoyIcon,
          },
          {
            label: 'Settings',
            href: '/settings',
            icon: Cog6ToothIcon,
          },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white">Dashboard</h1>
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
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <DashboardContent user={user} />
          </div>
        </main>
      </div>
    </div>
  )
}
