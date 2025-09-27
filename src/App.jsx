import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import AuthFixed from './AuthFixed'
import EmployeeList from './EmployeeList'
import AddEmployee from './AddEmployee'
import AvailabilityManager from './AvailabilityManager'
import AvailabilityOverview from './AvailabilityOverview'
import TimeOffRequest from './TimeOffRequest'
import TimeOffManager from './TimeOffManager'
import ScheduleTemplates from './ScheduleTemplates'
import BaseScheduleManager from './BaseScheduleManager'
import ScheduleGenerator from './ScheduleGenerator'
import UserManagement from './UserManagement'
import { UserProvider, useUser } from './UserContext-Simplified'
import './App.css'

function AppContent() {
  const { user, userProfile, loading: userLoading, canManageEmployees, canManageUserAccounts } = useUser()
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshEmployees, setRefreshEmployees] = useState(0)
  const [activeTab, setActiveTab] = useState('employees')

  useEffect(() => {
    // Wait for user context to load
    if (!userLoading) {
      setLoading(false)
    }
  }, [userLoading])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleEmployeeAdded = () => {
    setRefreshEmployees(prev => prev + 1)
    setShowAddForm(false)
  }

  if (loading || userLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading...</p>
        {userLoading && <p style={{ fontSize: '0.875rem', color: '#666' }}>Loading user profile...</p>}
      </div>
    )
  }

  if (!user) {
    return <AuthFixed />
  }

  // If user profile is not available, treat as staff with basic access
  const effectiveUserProfile = userProfile || { 
    user_role: 'staff', 
    full_name: user.email?.split('@')[0] || 'User',
    email: user.email 
  }

  // Define navigation tabs based on user permissions
  const getNavigationTabs = () => {
    const baseTabs = [
      { key: 'employees', label: 'Employees', icon: '👥' },
      { key: 'availability-overview', label: 'Team Availability', icon: '📅' },
      { key: 'availability-manager', label: 'Set Availability', icon: '⚙️' },
      { key: 'time-off-request', label: 'Request Time Off', icon: '🏖️' },
      { key: 'schedule-generator', label: 'Weekly Schedules', icon: '📊' }
    ]

    // Add management tabs for managers and admins
    if (canManageEmployees()) {
      baseTabs.splice(4, 0, 
        { key: 'time-off-manager', label: 'Manage Time-Off', icon: '📋' },
        { key: 'schedule-templates', label: 'Schedule Templates', icon: '🗓️' },
        { key: 'base-schedule-manager', label: 'Base Schedule', icon: '📝' }
      )
    }

    // Add admin-only tabs
    if (canManageUserAccounts()) {
      baseTabs.push({ key: 'user-management', label: 'User Management', icon: '👤' })
    }

    return baseTabs
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Staff Scheduling System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ 
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: 
              effectiveUserProfile?.user_role === 'admin' ? '#dbeafe' : 
              effectiveUserProfile?.user_role === 'manager' ? '#fef3c7' : '#f0fdf4',
            color: 
              effectiveUserProfile?.user_role === 'admin' ? '#1e40af' : 
              effectiveUserProfile?.user_role === 'manager' ? '#92400e' : '#166534'
          }}>
            {effectiveUserProfile?.user_role?.charAt(0).toUpperCase() + effectiveUserProfile?.user_role?.slice(1)}
            {!userProfile && ' (Default)'}
          </span>
          <span>Welcome, {effectiveUserProfile?.full_name || user.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
          {getNavigationTabs().map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'employees') setShowAddForm(false);
              }}
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#374151',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'employees' && (
        <div>
          {canManageEmployees() && (
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: showAddForm ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {showAddForm ? 'Cancel' : 'Add New Employee'}
              </button>
            </div>
          )}

          {showAddForm && canManageEmployees() && <AddEmployee onEmployeeAdded={handleEmployeeAdded} />}

          <EmployeeList key={refreshEmployees} />
        </div>
      )}

      {activeTab === 'availability-overview' && <AvailabilityOverview />}

      {activeTab === 'availability-manager' && <AvailabilityManager />}

      {activeTab === 'time-off-request' && <TimeOffRequest />}

      {activeTab === 'time-off-manager' && canManageEmployees() && <TimeOffManager />}

      {activeTab === 'schedule-templates' && canManageEmployees() && <ScheduleTemplates />}

      {activeTab === 'base-schedule-manager' && canManageEmployees() && <BaseScheduleManager />}

      {activeTab === 'schedule-generator' && <ScheduleGenerator />}

      {activeTab === 'user-management' && canManageUserAccounts() && <UserManagement />}
    </div>
  )
}

// Main App component with UserProvider wrapper
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App
