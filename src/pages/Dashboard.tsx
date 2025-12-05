import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
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
  LifebuoyIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'

const navItemsDualTier: NavItemType[] = [
  {
    label: 'Home',
    href: '/',
    icon: HomeIcon,
    items: [
      { label: 'Overview', href: '/overview', icon: Square3Stack3DIcon },
      { label: 'Products', href: '/products', icon: RectangleStackIcon },
      { label: 'Orders', href: '/orders', icon: ChartBarIcon },
      { label: 'Customers', href: '/customers', icon: UsersIcon },
      { label: 'Inbox', href: '/inbox', icon: InboxIcon, badge: 4 },
      { label: "What's new?", href: '/whats-new', icon: SparklesIcon },
    ],
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    items: [
      { label: 'Overview', href: '/dashboard/overview', icon: Square3Stack3DIcon },
      { label: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, badge: 10 },
      { label: 'Analytics', href: '/dashboard/analytics', icon: PresentationChartLineIcon },
      { label: 'Saved reports', href: '/dashboard/saved-reports', icon: StarIcon },
      { label: 'Scheduled reports', href: '/dashboard/scheduled-reports', icon: ClockIcon },
      { label: 'User reports', href: '/dashboard/user-reports', icon: UserCircleIcon },
      { label: 'Manage notifications', href: '/dashboard/manage-notifications', icon: Cog6ToothIcon },
    ],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderIcon,
    items: [
      { label: 'View all', href: '/projects/all', icon: FolderIcon },
      { label: 'Personal', href: '/projects/personal', icon: UserIcon },
      { label: 'Team', href: '/projects/team', icon: UsersIcon },
      { label: 'Shared with me', href: '/projects/shared-with-me', icon: UserPlusIcon },
      { label: 'Archive', href: '/projects/archive', icon: ArchiveBoxIcon },
    ],
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckCircleIcon,
    badge: 10,
  },
  {
    label: 'Reporting',
    href: '/reporting',
    icon: ChartPieIcon,
  },
  {
    label: 'Users',
    href: '/users',
    icon: UsersIcon,
  },
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
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
            <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow-xl rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Welcome, {user?.user_metadata?.full_name || 'User'}!
                </h2>
                <div className="mt-4 space-y-2">
                  <p className="text-gray-400">
                    <span className="text-white font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white font-medium">User ID:</span> {user?.id}
                  </p>
                </div>
                <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-sm text-green-400">
                    You have successfully logged in! This is your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
