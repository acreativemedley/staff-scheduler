import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name')

      if (error) {
        setError(error.message)
      } else {
        setEmployees(data)
      }
    } catch (err) {
      setError('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (employee) => {
    setEditingEmployee(employee.id)
    setEditForm({ ...employee })
  }

  const cancelEditing = () => {
    setEditingEmployee(null)
    setEditForm({})
  }

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveEmployee = async () => {
    try {
      // Auto-set role based on position
      const updatedForm = {
        ...editForm,
        role: ['Manager', 'Owner'].includes(editForm.position) ? 'manager' : 'staff'
      }

      const { error } = await supabase
        .from('employees')
        .update(updatedForm)
        .eq('id', editingEmployee)

      if (error) {
        alert('Error updating employee: ' + error.message)
      } else {
        setEditingEmployee(null)
        setEditForm({})
        fetchEmployees() // Refresh the list
      }
    } catch (err) {
      alert('Failed to update employee')
    }
  }

  const deleteEmployee = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}? This cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId)

        if (error) {
          alert('Error deleting employee: ' + error.message)
        } else {
          fetchEmployees() // Refresh the list
        }
      } catch (err) {
        alert('Failed to delete employee')
      }
    }
  }

  if (loading) return <div>Loading employees...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Staff Directory</h2>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {employees.map((employee) => (
          <div 
            key={employee.id} 
            style={{ 
              border: '1px solid #ccc', 
              padding: '1rem', 
              borderRadius: '8px',
              backgroundColor: editingEmployee === employee.id ? '#fff3cd' : '#f9f9f9'
            }}
          >
            {editingEmployee === employee.id ? (
              // Edit Mode
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#856404' }}>Editing Employee</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Full Name:
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name || ''}
                        onChange={(e) => handleEditChange('full_name', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Display Name:
                      </label>
                      <input
                        type="text"
                        value={editForm.display_name || ''}
                        onChange={(e) => handleEditChange('display_name', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Position:
                      </label>
                      <select
                        value={editForm.position || ''}
                        onChange={(e) => handleEditChange('position', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="Sales Floor">Sales Floor</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Manager">Manager</option>
                        <option value="Owner">Owner</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Status:
                      </label>
                      <select
                        value={editForm.is_active ? 'active' : 'inactive'}
                        onChange={(e) => handleEditChange('is_active', e.target.value === 'active')}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Email:
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Phone:
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Min Hours/Week:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={editForm.minimum_hours_per_week || ''}
                        onChange={(e) => handleEditChange('minimum_hours_per_week', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Preferred Hours/Week:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={editForm.preferred_hours_per_week || ''}
                        onChange={(e) => handleEditChange('preferred_hours_per_week', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Max Hours/Week:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={editForm.maximum_hours_per_week || ''}
                        onChange={(e) => handleEditChange('maximum_hours_per_week', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Notes:
                    </label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => handleEditChange('notes', e.target.value)}
                      rows="3"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={cancelEditing}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEmployee}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{employee.full_name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEditing(employee)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.id, employee.full_name)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {employee.display_name && employee.display_name !== employee.full_name && (
                  <p><strong>Display Name:</strong> {employee.display_name}</p>
                )}
                <p><strong>Position:</strong> {employee.position} <span style={{ color: '#666' }}>({employee.role})</span></p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Phone:</strong> {employee.phone}</p>
                <p><strong>Hours/Week:</strong> 
                  {employee.minimum_hours_per_week || 'No min'} - {employee.preferred_hours_per_week || 'No pref'} - {employee.maximum_hours_per_week || 'No max'}
                </p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: employee.is_active ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
                {employee.notes && <p><strong>Notes:</strong> {employee.notes}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmployeeList