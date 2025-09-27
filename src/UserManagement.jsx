// User Management Component - Admin only
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useUser } from './UserContext'

export default function UserManagement() {
  const { canManageUserAccounts } = useUser()
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Redirect if no permission
  if (!canManageUserAccounts()) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access user management.</p>
      </div>
    )
  }

  // Fetch users and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch user profiles
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) {
          setError('Error loading users: ' + usersError.message)
          return
        }

        // Fetch employees for linking
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name')
          .eq('status', 'active')
          .order('full_name')

        if (employeesError) {
          console.error('Error loading employees:', employeesError)
        }

        setUsers(usersData || [])
        setEmployees(employeesData || [])
        setError('')
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEditUser = (user) => {
    setEditingUser(user.id)
    setEditForm({
      user_role: user.user_role,
      employee_id: user.employee_id || '',
      is_active: user.is_active
    })
  }

  const handleSaveUser = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(editForm)
        .eq('id', editingUser)

      if (error) {
        alert('Error updating user: ' + error.message)
        return
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser 
          ? { ...user, ...editForm }
          : user
      ))

      setEditingUser(null)
      setEditForm({})
      alert('User updated successfully')
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Failed to update user')
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) {
        alert('Error updating user status: ' + error.message)
        return
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ))

      alert('User status updated successfully')
    } catch (err) {
      console.error('Error updating user status:', err)
      alert('Failed to update user status')
    }
  }

  if (loading) return <div>Loading users...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div style={{ padding: '1rem' }}>
      <h2>User Management</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Manage user accounts and permissions. Only administrators can access this section.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {users.map((user) => (
          <div 
            key={user.id} 
            style={{ 
              border: '1px solid #ccc', 
              padding: '1rem', 
              borderRadius: '8px',
              backgroundColor: user.is_active ? '#f9f9f9' : '#f5f5f5',
              opacity: user.is_active ? 1 : 0.7
            }}
          >
            {editingUser === user.id ? (
              // Edit Mode
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#856404' }}>Editing User</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        User Role:
                      </label>
                      <select
                        value={editForm.user_role}
                        onChange={(e) => setEditForm(prev => ({ ...prev, user_role: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Linked Employee:
                      </label>
                      <select
                        value={editForm.employee_id}
                        onChange={(e) => setEditForm(prev => ({ ...prev, employee_id: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="">No linked employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span style={{ fontWeight: 'bold' }}>Active User</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSaveUser}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{user.full_name || 'Unnamed User'}</h3>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> 
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        marginLeft: '0.5rem',
                        backgroundColor: 
                          user.user_role === 'admin' ? '#dbeafe' : 
                          user.user_role === 'manager' ? '#fef3c7' : '#f0fdf4',
                        color: 
                          user.user_role === 'admin' ? '#1e40af' : 
                          user.user_role === 'manager' ? '#92400e' : '#166534'
                      }}>
                        {user.user_role?.charAt(0).toUpperCase() + user.user_role?.slice(1)}
                      </span>
                    </p>
                    <p><strong>Status:</strong> 
                      <span style={{ 
                        color: user.is_active ? '#22c55e' : '#dc2626',
                        fontWeight: 'bold',
                        marginLeft: '0.5rem'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    {user.employee_id && (
                      <p><strong>Linked Employee:</strong> 
                        {employees.find(emp => emp.id === user.employee_id)?.full_name || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button
                      onClick={() => handleEditUser(user)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleUserActive(user.id, user.is_active)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: user.is_active ? '#dc2626' : '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
          No users found.
        </p>
      )}
    </div>
  )
}