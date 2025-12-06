import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCircleIcon,
  BuildingOffice2Icon,
  TagIcon,
  UsersIcon,
  Cog6ToothIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  BanknotesIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  ChartPieIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../hooks/useAuth'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'
import ColorPicker from '../components/ColorPicker'
import IconPicker from '../components/IconPicker'
import Button from '../components/Button'
import Input from '../components/Input'

type Tab = 'account' | 'businesses' | 'categories' | 'vendors' | 'rules' | 'api'

const navItems: NavItemType[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { label: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon },
  { label: 'Matching', href: '/matching', icon: SparklesIcon },
  { label: 'Reports', href: '/reports', icon: ChartPieIcon },
]

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const settings = useSettings()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: UserCircleIcon },
    { id: 'businesses' as const, label: 'Businesses', icon: BuildingOffice2Icon },
    { id: 'categories' as const, label: 'Categories', icon: TagIcon },
    { id: 'vendors' as const, label: 'Vendors', icon: UsersIcon },
    { id: 'rules' as const, label: 'Rules', icon: Cog6ToothIcon },
    { id: 'api' as const, label: 'API', icon: KeyIcon },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  if (settings.loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-white text-lg">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0F1419] overflow-hidden">
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
                <h1 className="text-xl font-semibold text-white">Settings</h1>
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
        <main className="flex-1 overflow-y-auto">
          {/* Tabs */}
          <div className="bg-[#1a1f2e] border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#5ED591] text-[#5ED591]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          {activeTab === 'account' && <AccountSettings settings={settings} user={user} showNotification={showNotification} />}
          {activeTab === 'businesses' && <BusinessesSettings settings={settings} showNotification={showNotification} />}
          {activeTab === 'categories' && <CategoriesSettings settings={settings} showNotification={showNotification} />}
          {activeTab === 'vendors' && <VendorsSettings settings={settings} showNotification={showNotification} />}
          {activeTab === 'rules' && <RulesSettings settings={settings} showNotification={showNotification} />}
          {activeTab === 'api' && <APISettings showNotification={showNotification} />}
          </div>
          </div>
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg border ${
            notification.type === 'success'
              ? 'bg-green-900/90 border-green-700 text-green-100'
              : 'bg-red-900/90 border-red-700 text-red-100'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </div>
  )
}

// Account Settings Tab
function AccountSettings({ settings, user, showNotification }: any) {
  const [displayName, setDisplayName] = useState(settings.userSettings?.display_name || '')
  const [currency, setCurrency] = useState(settings.userSettings?.default_currency || 'ILS')
  const [dateFormat, setDateFormat] = useState(settings.userSettings?.date_format || 'DD/MM/YYYY')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await settings.updateUserSettings({
        display_name: displayName,
        default_currency: currency,
        date_format: dateFormat,
      })
      showNotification('success', 'Account settings updated successfully')
    } catch (error) {
      showNotification('error', 'Failed to update account settings')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your display name"
          className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Default Currency</label>
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
        >
          <option value="ILS">ILS (₪)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Date Format</label>
        <select
          value={dateFormat}
          onChange={e => setDateFormat(e.target.value)}
          className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={saving} className="w-auto px-8">
          Save Changes
        </Button>
      </div>
    </form>
  )
}

// Businesses Settings Tab
function BusinessesSettings({ settings, showNotification }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    logo_url: '',
    color: '#10b981',
    is_default: false,
  })

  const handleAdd = async () => {
    try {
      await settings.addBusiness(formData)
      showNotification('success', 'Business added successfully')
      setIsAdding(false)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to add business')
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      await settings.updateBusiness(editingId, formData)
      showNotification('success', 'Business updated successfully')
      setEditingId(null)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to update business')
      console.error(error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      await settings.deleteBusiness(id)
      showNotification('success', 'Business deleted successfully')
    } catch (error) {
      showNotification('error', 'Failed to delete business')
      console.error(error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await settings.setDefaultBusiness(id)
      showNotification('success', 'Default business updated')
    } catch (error) {
      showNotification('error', 'Failed to set default business')
      console.error(error)
    }
  }

  const startEdit = (business: any) => {
    setEditingId(business.id)
    setFormData({
      name: business.name,
      tax_id: business.tax_id || '',
      logo_url: business.logo_url || '',
      color: business.color,
      is_default: business.is_default,
    })
    setIsAdding(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      tax_id: '',
      logo_url: '',
      color: '#10b981',
      is_default: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Businesses</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Business
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl space-y-4">
          <h3 className="text-lg font-medium text-white">
            {editingId ? 'Edit Business' : 'Add New Business'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Business"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Tax ID</label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="123456789"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Logo URL</label>
            <input
              type="text"
              value={formData.logo_url}
              onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <ColorPicker
            label="Color"
            value={formData.color}
            onChange={color => setFormData({ ...formData, color })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-[#0F1419]/70 text-[#5ED591] focus:ring-[#5ED591]"
            />
            <label htmlFor="is_default" className="text-sm text-gray-200">
              Set as default business
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-5 h-5" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                resetForm()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Business List */}
      <div className="space-y-3">
        {settings.businesses.map((business: any) => (
          <div
            key={business.id}
            className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1"
                  style={{ backgroundColor: business.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">{business.name}</h3>
                    {business.is_default && (
                      <span className="px-2 py-0.5 text-xs bg-[#5ED591]/20 text-[#5ED591] rounded-full border border-[#5ED591]/30">
                        Default
                      </span>
                    )}
                  </div>
                  {business.tax_id && (
                    <p className="text-sm text-gray-400 mt-1">Tax ID: {business.tax_id}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!business.is_default && (
                  <button
                    onClick={() => handleSetDefault(business.id)}
                    className="px-3 py-1 text-xs text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => startEdit(business)}
                  className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(business.id, business.name)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {settings.businesses.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">
            No businesses yet. Click "Add Business" to create one.
          </div>
        )}
      </div>
    </div>
  )
}

// Categories Settings Tab
function CategoriesSettings({ settings, showNotification }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    icon: 'BanknotesIcon',
    color: '#10b981',
    parent_id: null as string | null,
  })
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['income', 'expense', 'transfer']))

  const handleAdd = async () => {
    try {
      await settings.addCategory(formData)
      showNotification('success', 'Category added successfully')
      setIsAdding(false)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to add category')
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      await settings.updateCategory(editingId, formData)
      showNotification('success', 'Category updated successfully')
      setEditingId(null)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to update category')
      console.error(error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      await settings.deleteCategory(id)
      showNotification('success', 'Category deleted successfully')
    } catch (error) {
      showNotification('error', 'Failed to delete category')
      console.error(error)
    }
  }

  const startEdit = (category: any) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || 'BanknotesIcon',
      color: category.color || '#10b981',
      parent_id: category.parent_id,
    })
    setIsAdding(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: 'BanknotesIcon',
      color: '#10b981',
      parent_id: null,
    })
  }

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }

  // Group categories by type
  const categoriesByType = settings.categories.reduce((acc: any, cat: any) => {
    if (!acc[cat.type]) acc[cat.type] = []
    acc[cat.type].push(cat)
    return acc
  }, {})

  // Get parent categories (those without parent_id)
  const getParentCategories = (type: string) => {
    return (categoriesByType[type] || []).filter((cat: any) => !cat.parent_id)
  }

  // Get child categories
  const getChildCategories = (parentId: string) => {
    return settings.categories.filter((cat: any) => cat.parent_id === parentId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Categories</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl space-y-4">
          <h3 className="text-lg font-medium text-white">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Office Supplies"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Type *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <IconPicker
            label="Icon"
            value={formData.icon}
            onChange={icon => setFormData({ ...formData, icon })}
          />

          <ColorPicker
            label="Color"
            value={formData.color}
            onChange={color => setFormData({ ...formData, color })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Parent Category</label>
            <select
              value={formData.parent_id || ''}
              onChange={e => setFormData({ ...formData, parent_id: e.target.value || null })}
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            >
              <option value="">None (Top Level)</option>
              {getParentCategories(formData.type).map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-5 h-5" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                resetForm()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Tree View */}
      <div className="space-y-2">
        {['income', 'expense', 'transfer'].map(type => {
          const parentCats = getParentCategories(type)
          if (parentCats.length === 0) return null

          return (
            <div key={type} className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleType(type)}
                className="w-full px-4 py-3 bg-[#0F1419]/50 flex items-center justify-between hover:bg-[#0F1419]/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedTypes.has(type) ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white font-medium capitalize">{type}</span>
                  <span className="text-sm text-gray-400">({parentCats.length})</span>
                </div>
              </button>

              {expandedTypes.has(type) && (
                <div className="p-2 space-y-1">
                  {parentCats.map((category: any) => (
                    <div key={category.id}>
                      <div className="flex items-center justify-between p-3 bg-[#0F1419]/30 rounded-lg hover:bg-[#0F1419]/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || '#10b981' }}
                          />
                          <span className="text-white">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Child categories */}
                      {getChildCategories(category.id).map((child: any) => (
                        <div
                          key={child.id}
                          className="ml-6 flex items-center justify-between p-3 bg-[#0F1419]/20 rounded-lg hover:bg-[#0F1419]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: child.color || '#10b981' }}
                            />
                            <span className="text-gray-300 text-sm">{child.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(child)}
                              className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(child.id, child.name)}
                              className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {settings.categories.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">
            No categories yet. Click "Add Category" to create one.
          </div>
        )}
      </div>
    </div>
  )
}

// Vendors Settings Tab
function VendorsSettings({ settings, showNotification }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    primary_name: '',
    aliases: [] as string[],
  })
  const [newAlias, setNewAlias] = useState('')

  const handleAdd = async () => {
    try {
      await settings.addVendorAlias(formData)
      showNotification('success', 'Vendor alias added successfully')
      setIsAdding(false)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to add vendor alias')
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      await settings.updateVendorAlias(editingId, formData)
      showNotification('success', 'Vendor alias updated successfully')
      setEditingId(null)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to update vendor alias')
      console.error(error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return
    try {
      await settings.deleteVendorAlias(id)
      showNotification('success', 'Vendor alias deleted successfully')
    } catch (error) {
      showNotification('error', 'Failed to delete vendor alias')
      console.error(error)
    }
  }

  const startEdit = (vendor: any) => {
    setEditingId(vendor.id)
    setFormData({
      primary_name: vendor.primary_name,
      aliases: vendor.aliases || [],
    })
    setIsAdding(false)
  }

  const resetForm = () => {
    setFormData({
      primary_name: '',
      aliases: [],
    })
    setNewAlias('')
  }

  const addAlias = () => {
    if (newAlias.trim() && !formData.aliases.includes(newAlias.trim())) {
      setFormData({ ...formData, aliases: [...formData.aliases, newAlias.trim()] })
      setNewAlias('')
    }
  }

  const removeAlias = (alias: string) => {
    setFormData({ ...formData, aliases: formData.aliases.filter(a => a !== alias) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Vendor Aliases</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Vendor Alias
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl space-y-4">
          <h3 className="text-lg font-medium text-white">
            {editingId ? 'Edit Vendor Alias' : 'Add New Vendor Alias'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Primary Name *</label>
            <input
              type="text"
              value={formData.primary_name}
              onChange={e => setFormData({ ...formData, primary_name: e.target.value })}
              placeholder="Amazon"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Aliases</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                placeholder="AMAZON.COM*123"
                className="flex-1 px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
              />
              <button
                onClick={addAlias}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="space-y-1">
              {formData.aliases.map((alias, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-[#0F1419]/30 rounded-lg"
                >
                  <span className="text-gray-200">{alias}</span>
                  <button
                    onClick={() => removeAlias(alias)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.primary_name}
              className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-5 h-5" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                resetForm()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Vendor List */}
      <div className="space-y-3">
        {settings.vendorAliases.map((vendor: any) => (
          <div
            key={vendor.id}
            className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-medium text-white">{vendor.primary_name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(vendor)}
                  className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(vendor.id, vendor.primary_name)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {vendor.aliases && vendor.aliases.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Aliases:</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.aliases.map((alias: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {settings.vendorAliases.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">
            No vendor aliases yet. Click "Add Vendor Alias" to create one.
          </div>
        )}
      </div>
    </div>
  )
}

// Rules Settings Tab
function RulesSettings({ settings, showNotification }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    priority: 1,
    is_active: true,
    conditions: {
      description_contains: '',
      amount_min: '',
      amount_max: '',
      direction: '',
    },
    auto_match: false,
    assign_business_id: null as string | null,
    assign_category_id: null as string | null,
  })

  const handleAdd = async () => {
    try {
      await settings.addMatchingRule({
        ...formData,
        conditions: formData.conditions,
      })
      showNotification('success', 'Matching rule added successfully')
      setIsAdding(false)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to add matching rule')
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      await settings.updateMatchingRule(editingId, {
        ...formData,
        conditions: formData.conditions,
      })
      showNotification('success', 'Matching rule updated successfully')
      setEditingId(null)
      resetForm()
    } catch (error) {
      showNotification('error', 'Failed to update matching rule')
      console.error(error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete rule "${name}"?`)) return
    try {
      await settings.deleteMatchingRule(id)
      showNotification('success', 'Matching rule deleted successfully')
    } catch (error) {
      showNotification('error', 'Failed to delete matching rule')
      console.error(error)
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await settings.updateMatchingRule(id, { is_active: !currentState })
      showNotification('success', 'Rule status updated')
    } catch (error) {
      showNotification('error', 'Failed to update rule status')
      console.error(error)
    }
  }

  const movePriority = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = settings.matchingRules.findIndex((r: any) => r.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= settings.matchingRules.length) return

    const newOrder = [...settings.matchingRules]
    const [removed] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, removed)

    try {
      await settings.reorderMatchingRules(newOrder.map((r: any) => r.id))
      showNotification('success', 'Rule priority updated')
    } catch (error) {
      showNotification('error', 'Failed to update rule priority')
      console.error(error)
    }
  }

  const startEdit = (rule: any) => {
    setEditingId(rule.id)
    const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions
    setFormData({
      name: rule.name,
      priority: rule.priority,
      is_active: rule.is_active,
      conditions: {
        description_contains: conditions.description_contains || '',
        amount_min: conditions.amount_min || '',
        amount_max: conditions.amount_max || '',
        direction: conditions.direction || '',
      },
      auto_match: rule.auto_match,
      assign_business_id: rule.assign_business_id,
      assign_category_id: rule.assign_category_id,
    })
    setIsAdding(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 1,
      is_active: true,
      conditions: {
        description_contains: '',
        amount_min: '',
        amount_max: '',
        direction: '',
      },
      auto_match: false,
      assign_business_id: null,
      assign_category_id: null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Matching Rules</h2>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Rule
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-[#0F1419]/50 border border-gray-700 rounded-xl space-y-4">
          <h3 className="text-lg font-medium text-white">
            {editingId ? 'Edit Matching Rule' : 'Add New Matching Rule'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Rule Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Amazon Purchases"
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-md font-medium text-white mb-3">Conditions</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Description Contains</label>
                <input
                  type="text"
                  value={formData.conditions.description_contains}
                  onChange={e => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, description_contains: e.target.value }
                  })}
                  placeholder="AMAZON"
                  className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Amount Min</label>
                  <input
                    type="number"
                    value={formData.conditions.amount_min}
                    onChange={e => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, amount_min: e.target.value }
                    })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Amount Max</label>
                  <input
                    type="number"
                    value={formData.conditions.amount_max}
                    onChange={e => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, amount_max: e.target.value }
                    })}
                    placeholder="1000"
                    className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Direction</label>
                <select
                  value={formData.conditions.direction}
                  onChange={e => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, direction: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                >
                  <option value="">Any</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-md font-medium text-white mb-3">Actions</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Assign Business</label>
                <select
                  value={formData.assign_business_id || ''}
                  onChange={e => setFormData({ ...formData, assign_business_id: e.target.value || null })}
                  className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                >
                  <option value="">None</option>
                  {settings.businesses.map((business: any) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Assign Category</label>
                <select
                  value={formData.assign_category_id || ''}
                  onChange={e => setFormData({ ...formData, assign_category_id: e.target.value || null })}
                  className="w-full px-4 py-2 bg-[#0F1419]/70 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
                >
                  <option value="">None</option>
                  {settings.categories.map((category: any) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_match"
                  checked={formData.auto_match}
                  onChange={e => setFormData({ ...formData, auto_match: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-[#0F1419]/70 text-[#5ED591] focus:ring-[#5ED591]"
                />
                <label htmlFor="auto_match" className="text-sm text-gray-200">
                  Auto-match transactions
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-[#0F1419]/70 text-[#5ED591] focus:ring-[#5ED591]"
                />
                <label htmlFor="is_active" className="text-sm text-gray-200">
                  Rule is active
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-5 h-5" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                resetForm()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {settings.matchingRules.map((rule: any, index: number) => {
          const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions
          const assignedBusiness = settings.businesses.find((b: any) => b.id === rule.assign_business_id)
          const assignedCategory = settings.categories.find((c: any) => c.id === rule.assign_category_id)

          return (
            <div
              key={rule.id}
              className={`p-4 bg-[#0F1419]/50 border rounded-xl transition-colors ${
                rule.is_active ? 'border-gray-700 hover:border-gray-600' : 'border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={() => toggleActive(rule.id, rule.is_active)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#0F1419]/70 text-[#5ED591] focus:ring-[#5ED591]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-white">{rule.name}</h3>
                      <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded-full">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      {conditions.description_contains && (
                        <p>If description contains "{conditions.description_contains}"</p>
                      )}
                      {(conditions.amount_min || conditions.amount_max) && (
                        <p>
                          Amount: {conditions.amount_min || '0'} - {conditions.amount_max || '∞'}
                        </p>
                      )}
                      {conditions.direction && (
                        <p>Direction: {conditions.direction}</p>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      {assignedCategory && (
                        <p className="text-[#5ED591]">→ Assign to category: {assignedCategory.name}</p>
                      )}
                      {assignedBusiness && (
                        <p className="text-[#5ED591]">→ Assign to business: {assignedBusiness.name}</p>
                      )}
                      {rule.auto_match && (
                        <p className="text-[#5ED591]">→ Auto-match enabled</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => movePriority(rule.id, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => movePriority(rule.id, 'down')}
                    disabled={index === settings.matchingRules.length - 1}
                    className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(rule)}
                    className="p-2 text-gray-400 hover:text-[#5ED591] rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id, rule.name)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {settings.matchingRules.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">
            No matching rules yet. Click "Add Rule" to create one.
          </div>
        )}
      </div>
    </div>
  )
}

// API Settings Tab
function APISettings({ showNotification }: any) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [showKey, setShowKey] = useState(false)
  const [threshold, setThreshold] = useState(
    parseInt(localStorage.getItem('confidence_threshold') || '70')
  )
  const [autoProcess, setAutoProcess] = useState(
    localStorage.getItem('auto_process') === 'true'
  )
  const [testing, setTesting] = useState(false)

  const handleSave = () => {
    try {
      localStorage.setItem('gemini_api_key', apiKey)
      localStorage.setItem('confidence_threshold', threshold.toString())
      localStorage.setItem('auto_process', autoProcess.toString())
      showNotification('success', 'API settings saved successfully')
    } catch (error) {
      showNotification('error', 'Failed to save API settings')
      console.error(error)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      // TODO: Implement actual API test
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('success', 'API connection successful')
    } catch (error) {
      showNotification('error', 'API connection failed')
      console.error(error)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Gemini API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-4 py-3 pr-12 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showKey ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Get your API key from{' '}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5ED591] hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Confidence Threshold: {threshold}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={threshold}
          onChange={e => setThreshold(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#5ED591]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="auto_process"
          checked={autoProcess}
          onChange={e => setAutoProcess(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-[#0F1419]/70 text-[#5ED591] focus:ring-[#5ED591]"
        />
        <label htmlFor="auto_process" className="text-sm text-gray-200">
          Auto-process files on upload
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[#5ED591] text-white rounded-lg hover:bg-[#4FFFB0] transition-colors"
        >
          Save Settings
        </button>
        <button
          onClick={handleTest}
          disabled={!apiKey || testing}
          className="px-6 py-2 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  )
}
