import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

type UserSettings = Database['public']['Tables']['user_settings']['Row']
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

type Business = Database['public']['Tables']['businesses']['Row']
type BusinessInsert = Database['public']['Tables']['businesses']['Insert']
type BusinessUpdate = Database['public']['Tables']['businesses']['Update']

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

type VendorAlias = Database['public']['Tables']['vendor_aliases']['Row']
type VendorAliasInsert = Database['public']['Tables']['vendor_aliases']['Insert']
type VendorAliasUpdate = Database['public']['Tables']['vendor_aliases']['Update']

type MatchingRule = Database['public']['Tables']['matching_rules']['Row']
type MatchingRuleInsert = Database['public']['Tables']['matching_rules']['Insert']
type MatchingRuleUpdate = Database['public']['Tables']['matching_rules']['Update']

export interface UseSettingsReturn {
  // User settings
  userSettings: UserSettings | null
  updateUserSettings: (updates: UserSettingsUpdate) => Promise<void>

  // Businesses
  businesses: Business[]
  addBusiness: (business: Omit<BusinessInsert, 'user_id'>) => Promise<void>
  updateBusiness: (id: string, updates: BusinessUpdate) => Promise<void>
  deleteBusiness: (id: string) => Promise<void>
  setDefaultBusiness: (id: string) => Promise<void>

  // Categories
  categories: Category[]
  addCategory: (category: Omit<CategoryInsert, 'user_id'>) => Promise<void>
  updateCategory: (id: string, updates: CategoryUpdate) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Vendor aliases
  vendorAliases: VendorAlias[]
  addVendorAlias: (alias: Omit<VendorAliasInsert, 'user_id'>) => Promise<void>
  updateVendorAlias: (id: string, updates: VendorAliasUpdate) => Promise<void>
  deleteVendorAlias: (id: string) => Promise<void>

  // Matching rules
  matchingRules: MatchingRule[]
  addMatchingRule: (rule: Omit<MatchingRuleInsert, 'user_id'>) => Promise<void>
  updateMatchingRule: (id: string, updates: MatchingRuleUpdate) => Promise<void>
  deleteMatchingRule: (id: string) => Promise<void>
  reorderMatchingRules: (orderedIds: string[]) => Promise<void>

  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const { user } = useAuth()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [vendorAliases, setVendorAliases] = useState<VendorAlias[]>([])
  const [matchingRules, setMatchingRules] = useState<MatchingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAll = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single()

      if (settingsError) throw settingsError
      setUserSettings(settingsData)

      // Fetch businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (businessesError) throw businessesError
      setBusinesses(businessesData || [])

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch vendor aliases
      const { data: aliasesData, error: aliasesError } = await supabase
        .from('vendor_aliases')
        .select('*')
        .eq('user_id', user.id)
        .order('primary_name', { ascending: true })

      if (aliasesError) throw aliasesError
      setVendorAliases(aliasesData || [])

      // Fetch matching rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('matching_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })

      if (rulesError) throw rulesError
      setMatchingRules(rulesData || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'))
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [user])

  // User Settings
  const updateUserSettings = async (updates: UserSettingsUpdate) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    await fetchAll()
  }

  // Businesses
  const addBusiness = async (business: Omit<BusinessInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    // If this is the first business or set as default, unset other defaults
    if (business.is_default || businesses.length === 0) {
      await supabase
        .from('businesses')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { error } = await supabase
      .from('businesses')
      .insert({
        ...business,
        user_id: user.id,
        is_default: business.is_default ?? businesses.length === 0
      })

    if (error) throw error
    await fetchAll()
  }

  const updateBusiness = async (id: string, updates: BusinessUpdate) => {
    if (!user) throw new Error('User not authenticated')

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from('businesses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id)
    }

    const { error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const deleteBusiness = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const setDefaultBusiness = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    // Unset all defaults first
    await supabase
      .from('businesses')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set the new default
    await updateBusiness(id, { is_default: true })
  }

  // Categories
  const addCategory = async (category: Omit<CategoryInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('categories')
      .insert({
        ...category,
        user_id: user.id
      })

    if (error) throw error
    await fetchAll()
  }

  const updateCategory = async (id: string, updates: CategoryUpdate) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  // Vendor Aliases
  const addVendorAlias = async (alias: Omit<VendorAliasInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('vendor_aliases')
      .insert({
        ...alias,
        user_id: user.id
      })

    if (error) throw error
    await fetchAll()
  }

  const updateVendorAlias = async (id: string, updates: VendorAliasUpdate) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('vendor_aliases')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const deleteVendorAlias = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('vendor_aliases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  // Matching Rules
  const addMatchingRule = async (rule: Omit<MatchingRuleInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('matching_rules')
      .insert({
        ...rule,
        user_id: user.id
      })

    if (error) throw error
    await fetchAll()
  }

  const updateMatchingRule = async (id: string, updates: MatchingRuleUpdate) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('matching_rules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const deleteMatchingRule = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('matching_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    await fetchAll()
  }

  const reorderMatchingRules = async (orderedIds: string[]) => {
    if (!user) throw new Error('User not authenticated')

    // Update priorities based on order (higher index = higher priority)
    const updates = orderedIds.map((id, index) => ({
      id,
      priority: orderedIds.length - index
    }))

    for (const update of updates) {
      await supabase
        .from('matching_rules')
        .update({ priority: update.priority })
        .eq('id', update.id)
        .eq('user_id', user.id)
    }

    await fetchAll()
  }

  return {
    userSettings,
    updateUserSettings,
    businesses,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    setDefaultBusiness,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    vendorAliases,
    addVendorAlias,
    updateVendorAlias,
    deleteVendorAlias,
    matchingRules,
    addMatchingRule,
    updateMatchingRule,
    deleteMatchingRule,
    reorderMatchingRules,
    loading,
    error,
    refetch: fetchAll
  }
}
