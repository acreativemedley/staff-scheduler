// Improved User context with timeout handling and proper permission checks
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
    
    console.log('UserContext-Improved: hasPermission check:', {
      currentRole,
      requiredRole,
      userLevel,
      requiredLevel,
      result: userLevel >= requiredLevel
    })
    
    return userLevel >= requiredLevel
  }

  // Permission check functions for specific features
  const canManageEmployees = () => hasPermission(PERMISSIONS.MANAGER)
  const canDeleteEmployees = () => hasPermission(PERMISSIONS.ADMIN)
  const canManageSchedules = () => hasPermission(PERMISSIONS.MANAGER)
  const canManageUserAccounts = () => hasPermission(PERMISSIONS.ADMIN)
  const canViewReports = () => hasPermission(PERMISSIONS.MANAGER)
  const canManageSettings = () => hasPermission(PERMISSIONS.ADMIN)

  // Fetch user profile data with timeout
  const fetchUserProfile = async (userId) => {
    try {
      console.log('UserContext-Improved: Fetching profile for user ID:', userId)
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      // Create the database query promise
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Race between query and timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        console.error('UserContext-Improved: Error fetching user profile:', error)
        // If the user profile doesn't exist, return null rather than crashing
        return null
      }

      console.log('UserContext-Improved: Profile data received:', data)
      return data
    } catch (err) {
      console.error('UserContext-Improved: Error or timeout in fetchUserProfile:', err)
      return null
    }
  }

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user?.id)
        .select()
        .single()

      if (error) throw error

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
        console.log('UserContext-Improved: Initializing user...')
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('UserContext-Improved: Session data:', session)
        
        if (session?.user) {
          console.log('UserContext-Improved: User found, setting user state')
          setUser(session.user)
          console.log('UserContext-Improved: Fetching user profile for:', session.user.id)
          const profile = await fetchUserProfile(session.user.id)
          console.log('UserContext-Improved: Profile fetched:', profile)
          setUserProfile(profile)
        } else {
          console.log('UserContext-Improved: No session found')
        }
      } catch (error) {
        console.error('UserContext-Improved: Error initializing user:', error)
      } finally {
        console.log('UserContext-Improved: Setting loading to false')
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext-Improved: Auth state changed:', event, session?.user?.id)
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
          console.error('UserContext-Improved: Error in auth state change:', error)
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