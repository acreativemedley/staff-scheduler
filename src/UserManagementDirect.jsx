// Temporary User Management without context dependency
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function UserManagementDirect() {
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('UserManagementDirect: Fetching users directly...')
        
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('UserManagementDirect: Users result:', { usersData, usersError })
        
        if (usersError) {
          setError('Error: ' + usersError.message)
        } else {
          setUsers(usersData || [])
        }

        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, role, position')
          .order('full_name')

        console.log('UserManagementDirect: Employees result:', { employeesData, employeesError })

        if (!employeesError) {
          setEmployees(employeesData || [])
        } else {
          console.error('UserManagementDirect: Employees error:', employeesError)
        }

      } catch (err) {
        console.error('UserManagementDirect: Error:', err)
        setError('Failed to load: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading users...</div>
  
  return (
    <div style={{ padding: '1rem' }}>
      <h2>User Management (Direct Access)</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Temporary direct access to user profiles (bypassing context issues)
      </p>

      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px'
      }}>
        <strong>Status:</strong><br />
        Users loaded: {users.length}<br />
        Employees loaded: {employees.length}<br />
        {error && <span style={{ color: '#dc2626' }}>Error: {error}</span>}
      </div>

      {users.map((user) => (
        <div 
          key={user.id} 
          style={{ 
            border: '1px solid #ccc', 
            padding: '1rem', 
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}
        >
          <h3>{user.full_name || 'Unnamed User'}</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.user_role}</p>
          <p><strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>
      ))}

      {users.length === 0 && !error && (
        <p>No users found.</p>
      )}

      {employees.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Employees ({employees.length})</h3>
          {employees.map((employee) => (
            <div 
              key={employee.id} 
              style={{ 
                border: '1px solid #ddd', 
                padding: '0.5rem', 
                marginBottom: '0.5rem',
                borderRadius: '4px',
                backgroundColor: '#f0f0f0'
              }}
            >
              <strong>{employee.full_name}</strong> - Role: {employee.role || 'unknown'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}