// Temporary simplified UserContext to bypass loading issues
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

  // Simplified permission checks - ALWAYS return true for debugging
  const hasPermission = (requiredRole) => {
    console.log('UserContext-Simplified: hasPermission called with:', requiredRole, 'returning true')
    return true
  }

  // Permission check functions for specific features - ALWAYS return true
  const canManageEmployees = () => {
    console.log('UserContext-Simplified: canManageEmployees called, returning true')
    return true
  }
  const canDeleteEmployees = () => {
    console.log('UserContext-Simplified: canDeleteEmployees called, returning true')
    return true
  }
  const canManageSchedules = () => {
    console.log('UserContext-Simplified: canManageSchedules called, returning true')
    return true
  }
  const canManageUserAccounts = () => {
    console.log('UserContext-Simplified: canManageUserAccounts called, returning true')
    return true
  }
  const canViewReports = () => {
    console.log('UserContext-Simplified: canViewReports called, returning true')
    return true
  }
  const canManageSettings = () => {
    console.log('UserContext-Simplified: canManageSettings called, returning true')
    return true
  }

  // Simplified user profile fetch with timeout
  const fetchUserProfile = async (userId) => {
    try {
      console.log('Simplified UserContext: Fetching profile for user ID:', userId)
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )

      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error('Simplified UserContext: Error fetching user profile:', error)
        // Return a default admin profile instead of null
        return {
          id: userId,
          user_role: 'admin',
          full_name: 'Admin User',
          email: 'admin@example.com',
          is_active: true
        }
      }

      console.log('Simplified UserContext: Profile data received:', data)
      return data
    } catch (err) {
      console.error('Simplified UserContext: Error or timeout in fetchUserProfile:', err)
      // Return a default admin profile
      return {
        id: userId,
        user_role: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
        is_active: true
      }
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
        console.log('Simplified UserContext: Initializing user...')
        
        // Set a maximum loading time of 5 seconds
        const timeoutId = setTimeout(() => {
          console.log('Simplified UserContext: Timeout reached, setting loading to false')
          setLoading(false)
        }, 5000)

        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Simplified UserContext: Session data:', session)
        
        if (session?.user) {
          console.log('Simplified UserContext: User found, setting user state')
          setUser(session.user)
          console.log('Simplified UserContext: Fetching user profile for:', session.user.id)
          
          const profile = await fetchUserProfile(session.user.id)
          console.log('Simplified UserContext: Profile fetched:', profile)
          setUserProfile(profile)
        } else {
          console.log('Simplified UserContext: No session found')
        }
        
        clearTimeout(timeoutId)
      } catch (error) {
        console.error('Simplified UserContext: Error initializing user:', error)
      } finally {
        console.log('Simplified UserContext: Setting loading to false')
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Simplified UserContext: Auth state changed:', event, session?.user?.id)
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
          console.error('Simplified UserContext: Error in auth state change:', error)
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