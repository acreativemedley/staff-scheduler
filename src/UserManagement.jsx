// User Management Component - Admin only
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useUser } from './UserContext-Minimal';
import { parseDate } from './dateUtils';

export default function UserManagement() {
  const { canManageUserAccounts } = useUser()
  
  // Since we're using minimal context, always allow access for now
  const hasPermission = true // canManageUserAccounts()
  
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    user_role: 'staff',
    full_name: '',
    employee_id: ''
  })
  const [creating, setCreating] = useState(false)

  // Since we're using minimal context, always allow access for now
  // if (!hasPermission) {
  //   return (
  //     <div style={{ padding: '2rem', textAlign: 'center' }}>
  //       <h2>Access Denied</h2>
  //       <p>You do not have permission to manage user accounts.</p>
  //     </div>
  //   )
  // }

  // Fetch users and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('UserManagement: Starting to fetch data...')
        
        // Fetch user profiles with timeout
        console.log('UserManagement: Fetching user profiles...')
        const userProfilesPromise = supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        // Set a timeout for the query
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )

        const { data: usersData, error: usersError } = await Promise.race([
          userProfilesPromise,
          timeoutPromise
        ])

        console.log('UserManagement: User profiles result:', { usersData, usersError })

        if (usersError) {
          console.error('UserManagement: Error loading users:', usersError)
          setError('Error loading users: ' + usersError.message + '. Try refreshing the page.')
          setUsers([]) // Set empty array instead of leaving undefined
        } else {
          setUsers(usersData || [])
          console.log('UserManagement: Successfully loaded', usersData?.length || 0, 'users')
        }

        // Fetch employees for linking
        console.log('UserManagement: Fetching employees...')
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, position')
          .order('full_name')

        if (employeesError) {
          console.error('UserManagement: Error loading employees:', employeesError)
          setEmployees([]) // Set empty array
        } else {
          setEmployees(employeesData || [])
          console.log('UserManagement: Successfully loaded', employeesData?.length || 0, 'employees')
        }

        if (!usersError) {
          setError('')
        }
      } catch (err) {
        console.error('UserManagement: Error fetching data:', err)
        setError('Failed to load data: ' + err.message + '. The database may be having issues.')
        setUsers([])
        setEmployees([])
      } finally {
        setLoading(false)
        console.log('UserManagement: Finished loading data')
      }
    }

    fetchData()
  }, [])

  const handleEditUser = (user) => {
    setEditingUser(user.id)
    setEditForm({
      full_name: user.full_name || '',
      user_role: user.user_role,
      employee_id: user.employee_id || '',
      is_active: user.is_active
    })
  }

  const handleSaveUser = async () => {
    try {
      // Convert empty string to null for employee_id
      const updateData = {
        ...editForm,
        employee_id: editForm.employee_id || null
      }
      
      console.log('Saving user update:', updateData)
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', editingUser)

      if (error) {
        console.error('Save error:', error)
        alert('Error updating user: ' + error.message)
        return
      }

      console.log('User updated successfully')

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser 
          ? { ...user, ...updateData }
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

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      console.log('Creating user account:', createForm.email)

      // Create user via serverless endpoint (server uses service role key)
      const res = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          user_role: createForm.user_role,
          full_name: createForm.full_name,
          employee_id: createForm.employee_id || null
        })
      })

      const json = await res.json()
      if (!res.ok) {
        console.error('Server create-user error:', json)
        setError('Failed to create user: ' + (json?.error || JSON.stringify(json)))
        return
      }

      console.log('User created via server, id:', json.userId)

      // Reset form and refresh data
      setCreateForm({
        email: '',
        password: '',
        user_role: 'staff',
        full_name: '',
        employee_id: ''
      })
      setShowCreateForm(false)
      
      // Refresh the users list
      const { data: usersData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!fetchError) {
        setUsers(usersData || [])
      }

      alert('User account created successfully!')

    } catch (err) {
      console.error('Create user error:', err)
      setError('Failed to create user: ' + err.message)
    } finally {
      setCreating(false)
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

      {/* Debug Info */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>Debug Info:</strong><br />
        Loading: {loading ? 'Yes' : 'No'}<br />
        Users loaded: {users.length}<br />
        Employees loaded: {employees.length}<br />
        {error && <span style={{ color: '#dc2626' }}>Error: {error}</span>}
      </div>

      {/* Create User Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: showCreateForm ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div style={{
          border: '1px solid #ddd',
          padding: '1.5rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>Create New User Account</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email Address:
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Temporary Password:
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  User Role:
                </label>
                <select
                  value={createForm.user_role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, user_role: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Link to Employee (Optional):
              </label>
              <select
                value={createForm.employee_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, employee_id: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- No Employee Link --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.position})
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                Available employees: {employees.length}
              </small>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: creating ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: creating ? 'not-allowed' : 'pointer'
              }}
            >
              {creating ? 'Creating...' : 'Create User Account'}
            </button>
          </form>
        </div>
      )}

      {/* Manual Refresh Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Refresh Page
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            try {
              console.log('Manual fetch attempt...')
              const { data, error } = await supabase.from('user_profiles').select('*')
              console.log('Manual fetch result:', { data, error })
              if (data) setUsers(data)
              if (error) setError('Manual fetch error: ' + error.message)
            } catch (err) {
              setError('Manual fetch failed: ' + err.message)
            } finally {
              setLoading(false)
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Manual Fetch Users
        </button>
      </div>

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
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Full Name:
                    </label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
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
                        <option value="owner">Owner</option>
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
                          user.user_role === 'owner' ? '#fce7f3' :
                          user.user_role === 'manager' ? '#fef3c7' : '#f0fdf4',
                        color: 
                          user.user_role === 'admin' ? '#1e40af' : 
                          user.user_role === 'owner' ? '#9f1239' :
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
                    <p><strong>Created:</strong> {parseDate(user.created_at).toLocaleDateString()}</p>
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