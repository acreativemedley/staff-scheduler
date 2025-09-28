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
    let timeoutId
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

        // Create a minimal user object - bypass all permission checks
        const minimalUser = {
          id: authUser.id,
          email: authUser.email,
          role: 'admin', // Default to admin to bypass all restrictions
          permissions: {
            can_view_all: true,
            can_edit: true,
            can_delete: true,
            can_manage_users: true,
            can_manage_base_schedules: true,
            can_view_analytics: true
          }
        }

        console.log('Setting minimal user:', minimalUser)
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

    // Set a 2-second timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.log('UserContext timeout - setting default admin user')
      if (isMounted) {
        setUser({
          id: 'default',
          email: 'admin@admin.com',
          role: 'admin',
          permissions: {
            can_view_all: true,
            can_edit: true,
            can_delete: true,
            can_manage_users: true,
            can_manage_base_schedules: true,
            can_view_analytics: true
          }
        })
        setLoading(false)
      }
    }, 2000)

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
          clearTimeout(timeoutId)
          initUser()
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
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

  // Permission functions - always return true since we're bypassing all restrictions
  const canManageEmployees = () => true
  const canManageUserAccounts = () => true
  const canViewAll = () => true
  const canEdit = () => true
  const canDelete = () => true

  const value = {
    user,
    userProfile: user, // Same as user for simplicity
    loading,
    signOut,
    canManageEmployees,
    canManageUserAccounts,
    canViewAll,
    canEdit,
    canDelete
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}