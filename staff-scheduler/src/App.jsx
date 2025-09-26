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
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshEmployees, setRefreshEmployees] = useState(0)
  const [activeTab, setActiveTab] = useState('employees')

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleEmployeeAdded = () => {
    setRefreshEmployees(prev => prev + 1)
    setShowAddForm(false)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }

  if (!user) {
    return <AuthFixed onAuth={setUser} />
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Staff Scheduling System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.email}</span>
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
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { key: 'employees', label: 'Employees', icon: '👥' },
            { key: 'availability-overview', label: 'Team Availability', icon: '📅' },
            { key: 'availability-manager', label: 'Set Availability', icon: '⚙️' },
            { key: 'time-off-request', label: 'Request Time Off', icon: '🏖️' },
            { key: 'time-off-manager', label: 'Time-Off Requests', icon: '📋' },
            { key: 'schedule-templates', label: 'Schedule Templates', icon: '🗓️' },
            { key: 'base-schedule-manager', label: 'Base Schedule', icon: '📝' },
            { key: 'schedule-generator', label: 'Weekly Schedules', icon: '📊' }
          ].map(tab => (
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

          {showAddForm && <AddEmployee onEmployeeAdded={handleEmployeeAdded} />}

          <EmployeeList key={refreshEmployees} />
        </div>
      )}

      {activeTab === 'availability-overview' && <AvailabilityOverview />}

      {activeTab === 'availability-manager' && <AvailabilityManager />}

      {activeTab === 'time-off-request' && <TimeOffRequest />}

      {activeTab === 'time-off-manager' && <TimeOffManager />}

      {activeTab === 'schedule-templates' && <ScheduleTemplates />}

      {activeTab === 'base-schedule-manager' && <BaseScheduleManager />}

      {activeTab === 'schedule-generator' && <ScheduleGenerator />}
    </div>
  )
}

export default App
