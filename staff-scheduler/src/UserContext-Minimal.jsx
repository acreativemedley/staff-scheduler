import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const UserContext = createContext({})

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initUser = async () => {
      try {
        // Get current auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        console.log('Auth user check:', authUser)
        
        if (authError) {
          console.error('Auth error:', authError)
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (!authUser) {
          console.log('No authenticated user')
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        // Try to fetch user profile from database
        let userProfile = null
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          if (!profileError && profileData) {
            userProfile = profileData
            console.log('Fetched user profile:', userProfile)
          }
        } catch (err) {
          console.log('Could not fetch user profile, using defaults:', err)
        }

        // Create a minimal user object. Do NOT default to admin.
        // If a profile exists, use its role; otherwise default to a conservative 'staff' role.
        const resolvedRole = userProfile?.user_role || 'staff'
        const minimalUser = {
          id: authUser.id,
          email: authUser.email,
          full_name: userProfile?.full_name || authUser.email?.split('@')[0] || 'User',
          user_role: resolvedRole,
          employee_id: userProfile?.employee_id || null,
          role: resolvedRole === 'admin' || resolvedRole === 'manager' ? 'admin' : 'user',
          permissions: {
            // conservative defaults; grant escalated perms only to admin/manager
            can_view_all: resolvedRole === 'admin' || resolvedRole === 'manager',
            can_edit: resolvedRole === 'admin' || resolvedRole === 'manager',
            can_delete: resolvedRole === 'admin' || resolvedRole === 'manager',
            can_manage_users: resolvedRole === 'admin',
            can_manage_base_schedules: resolvedRole === 'admin' || resolvedRole === 'manager',
            can_view_analytics: resolvedRole === 'admin' || resolvedRole === 'manager'
          }
        }

        console.log('UserContext: Setting minimal user (conservative):', minimalUser)
        if (isMounted) {
          setUser(minimalUser)
          setLoading(false)
        }

      } catch (error) {
        console.error('User initialization error:', error)
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Initialize; if there's no authenticated user, initUser will set user to null and loading false.
    initUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // no timeout to clear
          initUser()
        }
      }
    )

    return () => {
      isMounted = false
      // subscription may be undefined in some environments; guard the unsubscribe
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Permission functions based on user role
  const canManageEmployees = () => {
    // Managers, Owners, and Admins can manage employees, schedules, and time-off
    return user?.user_role === 'manager' || user?.user_role === 'owner' || user?.user_role === 'admin'
  }
  
  const canManageUserAccounts = () => {
    // Managers, Owners, and Admins can manage user accounts
    return user?.user_role === 'manager' || user?.user_role === 'owner' || user?.user_role === 'admin'
  }
  
  const canViewAll = () => {
    // Managers, Owners, and Admins can view all employees
    // Staff can only view their own data (controlled in components)
    return user?.user_role === 'manager' || user?.user_role === 'owner' || user?.user_role === 'admin'
  }
  
  const canEdit = () => {
    // Managers, Owners, and Admins can edit schedules and templates
    return user?.user_role === 'manager' || user?.user_role === 'owner' || user?.user_role === 'admin'
  }
  
  const canDelete = () => {
    // Managers, Owners, and Admins can delete items
    return user?.user_role === 'manager' || user?.user_role === 'owner' || user?.user_role === 'admin'
  }
  
  const canManageOwnData = () => {
    // All users can manage their own availability and time-off
    return true
  }

  const value = {
    user,
    userProfile: user, // Same as user for simplicity
    loading,
    signOut,
    canManageEmployees,
    canManageUserAccounts,
    canViewAll,
    canEdit,
    canDelete,
    canManageOwnData
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}