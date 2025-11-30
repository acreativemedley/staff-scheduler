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
import DatabaseTest from './DatabaseTest'
import UserSettings from './UserSettings'
import { UserProvider, useUser } from './UserContext-Minimal'
import './App.css'
import './theme-utils.css'
import './mobile-responsive.css'

function AppContent() {
  const { user, userProfile, loading: userLoading, canManageEmployees, canManageUserAccounts } = useUser()
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshEmployees, setRefreshEmployees] = useState(0)
  const [activeTab, setActiveTab] = useState('schedule-generator') // Default to View Schedules
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <AuthFixed />
        </div>
      </div>
    )
  }

  // If user profile is not available, treat as staff with basic access
  const effectiveUserProfile = userProfile || { 
    user_role: 'staff', 
    full_name: user.email?.split('@')[0] || 'User',
    email: user.email 
  }

  // Define navigation tabs based on user permissions
  const getNavigationTabs = () => {
    const userRole = effectiveUserProfile?.user_role || 'staff'
    
    // Base tabs for all users (Staff, Manager, Admin, Owner)
    const baseTabs = [
      { key: 'availability-manager', label: 'My Availability', icon: '⚙️' },
      { key: 'time-off-request', label: 'Request Time Off', icon: '🏖️' },
      { key: 'time-off-manager', label: 'Manage My Time-Off', icon: '📋' },
      { key: 'schedule-generator', label: 'View Schedules', icon: '📊' }
    ]

    // Add manager/admin tabs
    if (canManageEmployees()) {
      baseTabs.unshift(
        { key: 'employees', label: 'Employees', icon: '👥' },
        { key: 'availability-overview', label: 'Team Availability', icon: '📅' }
      )
      baseTabs.push(
        { key: 'schedule-templates', label: 'Schedule Templates', icon: '🗓️' },
        { key: 'base-schedule-manager', label: 'Base Schedule', icon: '📝' }
      )
    }

    // Add admin-only tabs
    if (canManageUserAccounts()) {
      baseTabs.push({ key: 'user-management', label: 'User Management', icon: '👤' })
    }

    // Add settings tab for all users
    baseTabs.push({ key: 'account-settings', label: 'Account Settings', icon: '⚙️' })

    return baseTabs
  }

  return (
    <div style={{ 
      padding: '1rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0' }}>Staff Scheduling System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ 
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            backgroundColor: 
              effectiveUserProfile?.user_role === 'admin' ? '#dbeafe' : 
              effectiveUserProfile?.user_role === 'owner' ? '#fce7f3' :
              effectiveUserProfile?.user_role === 'manager' ? '#fef3c7' : '#f0fdf4',
            color: 
              effectiveUserProfile?.user_role === 'admin' ? '#1e40af' : 
              effectiveUserProfile?.user_role === 'owner' ? '#9f1239' :
              effectiveUserProfile?.user_role === 'manager' ? '#92400e' : '#166534'
          }}>
            {effectiveUserProfile?.user_role?.charAt(0).toUpperCase() + effectiveUserProfile?.user_role?.slice(1)}
            {!userProfile && ' (Default)'}
          </span>
          <span style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Welcome, {effectiveUserProfile?.full_name || user.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              whiteSpace: 'nowrap'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile-menu-toggle"
        style={{
          padding: '0.75rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1.5rem',
          marginBottom: '1rem',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>{mobileMenuOpen ? '✕' : '☰'}</span>
        <span style={{ fontSize: '1rem' }}>Menu</span>
      </button>

      {/* Desktop Navigation */}
      <div className="desktop-nav" style={{ 
        borderBottom: '2px solid var(--border-color)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ display: 'flex', gap: '0', flexWrap: 'nowrap', minWidth: 'min-content' }}>
          {getNavigationTabs().map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'employees') setShowAddForm(false);
              }}
              style={{
                padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)',
                backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
          />
          
          {/* Sliding Menu */}
          <div
            className="mobile-menu"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: 'var(--bg-primary)',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              overflowY: 'auto',
              padding: '1rem',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--border-color)'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: 'var(--text-primary)'
                }}
              >
                ✕
              </button>
            </div>
            
            <nav>
              {getNavigationTabs().map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key !== 'employees') setShowAddForm(false);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                    color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.5rem',
                    textAlign: 'left',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.key) {
                      e.target.style.backgroundColor = 'var(--bg-secondary, #f3f4f6)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.key) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

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

      {activeTab === 'time-off-manager' && <TimeOffManager />}

      {activeTab === 'schedule-templates' && canManageEmployees() && <ScheduleTemplates />}

      {activeTab === 'base-schedule-manager' && canManageEmployees() && <BaseScheduleManager />}

      {activeTab === 'schedule-generator' && <ScheduleGenerator />}

      {activeTab === 'user-management' && canManageUserAccounts() && <UserManagement />}

      {activeTab === 'account-settings' && <UserSettings user={user} userProfile={userProfile} />}
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
