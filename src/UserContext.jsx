// User context for role-based access control
import { createContext, useContext, useState, useEffect } from 'react'
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
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Permission levels hierarchy
  const PERMISSIONS = {
    ADMIN: 'admin',
    MANAGER: 'manager', 
    STAFF: 'staff'
  }

  // Check if user has required permission level
  const hasPermission = (requiredRole) => {
    // If no userProfile is loaded yet, default to staff permissions
    const currentRole = userProfile?.user_role || 'staff'
    
    const roleHierarchy = {
      admin: 3,
      manager: 2,
      staff: 1
    }
    
    const userLevel = roleHierarchy[currentRole] || 1
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }

  // Permission check functions for specific features
  const canManageEmployees = () => hasPermission(PERMISSIONS.MANAGER)
  const canDeleteEmployees = () => hasPermission(PERMISSIONS.ADMIN)
  const canManageSchedules = () => hasPermission(PERMISSIONS.MANAGER)
  const canManageUserAccounts = () => hasPermission(PERMISSIONS.ADMIN)
  const canViewReports = () => hasPermission(PERMISSIONS.MANAGER)
  const canManageSettings = () => hasPermission(PERMISSIONS.ADMIN)

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      console.log('UserContext: Fetching profile for user ID:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('UserContext: Error fetching user profile:', error)
        // If the user_profiles table doesn't exist or user profile doesn't exist,
        // we'll continue without a profile rather than crashing
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('UserContext: user_profiles table not found or user profile missing, continuing without profile')
          return null
        }
        return null
      }

      console.log('UserContext: Profile data received:', data)
      return data
    } catch (err) {
      console.error('UserContext: Error in fetchUserProfile:', err)
      return null
    }
  }

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return { error }
      }

      setUserProfile(data)
      return { data }
    } catch (err) {
      console.error('Error in updateUserProfile:', err)
      return { error: err }
    }
  }

  // Initialize user session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('UserContext: Initializing user...')
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('UserContext: Session data:', session)
        
        if (session?.user) {
          console.log('UserContext: User found, setting user state')
          setUser(session.user)
          console.log('UserContext: Fetching user profile for:', session.user.id)
          const profile = await fetchUserProfile(session.user.id)
          console.log('UserContext: Profile fetched:', profile)
          setUserProfile(profile)
        } else {
          console.log('UserContext: No session found')
        }
      } catch (error) {
        console.error('UserContext: Error initializing user:', error)
      } finally {
        console.log('UserContext: Setting loading to false')
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext: Auth state changed:', event, session?.user?.id)
        try {
          if (session?.user) {
            setUser(session.user)
            const profile = await fetchUserProfile(session.user.id)
            setUserProfile(profile)
          } else {
            setUser(null)
            setUserProfile(null)
          }
        } catch (error) {
          console.error('UserContext: Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    
    // Permission checks
    hasPermission,
    canManageEmployees,
    canDeleteEmployees,
    canManageSchedules,
    canManageUserAccounts,
    canViewReports,
    canManageSettings,
    
    // User management
    updateUserProfile,
    
    // Constants
    PERMISSIONS
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}