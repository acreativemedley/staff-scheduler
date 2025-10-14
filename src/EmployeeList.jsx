import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useUser } from './UserContext-Minimal'
import { theme } from './theme'

function EmployeeList() {
  const { canManageEmployees } = useUser()
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
      console.log('EmployeeList: Starting fetchEmployees...')
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name')

      console.log('EmployeeList: Fetch result:', { data, error, count: data?.length })

      if (error) {
        console.error('EmployeeList: Error fetching employees:', error)
        setError(error.message)
      } else {
        console.log('EmployeeList: Setting employees data:', data)
        setEmployees(data)
      }
    } catch (err) {
      console.error('EmployeeList: Catch error:', err)
      setError('Failed to fetch employees')
    } finally {
      console.log('EmployeeList: Setting loading to false')
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
        console.error('Error saving employee:', error)
        alert('Error saving employee: ' + error.message)
        return
      }

      setEditingEmployee(null)
      setEditForm({})
      fetchEmployees()
    } catch (err) {
      console.error('saveEmployee catch error:', err)
      alert('Failed to save employee: ' + err.message)
    }
  }

  const deleteEmployee = async (employeeId, fullName) => {
    if (!confirm(`Delete ${fullName}? This will remove related schedules and data.`)) return;
    try {
      console.log('Checking employee exists before delete:', employeeId)
      const { data: checkData, error: checkError } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('id', employeeId)

      console.log('Employee exists check:', { checkData, checkError });

      if (checkError) {
        console.error('Error checking employee exists:', checkError);
        alert('Error checking employee: ' + checkError.message);
        return;
      }

      if (!checkData || checkData.length === 0) {
        console.error('Employee not found with ID:', employeeId);
        alert('Employee not found. The list may be out of date.');
        fetchEmployees(); // Refresh the list
        return;
      }

      // Delete all related records first to avoid foreign key constraints
      console.log('Deleting related records...');

      // Delete from base_schedule first
      const { error: baseScheduleError } = await supabase
        .from('base_schedule')
        .delete()
        .eq('employee_id', employeeId);

      if (baseScheduleError) {
        console.log('Error deleting base schedule (may not exist):', baseScheduleError);
      } else {
        console.log('Deleted employee base schedule');
      }

      // Delete from weekly_schedules
      const { error: scheduleError } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('employee_id', employeeId);

      if (scheduleError) {
        console.log('Error deleting schedules (may not exist):', scheduleError);
      } else {
        console.log('Deleted employee schedules');
      }

      // Delete from employee_availability
      const { error: availError } = await supabase
        .from('employee_availability')
        .delete()
        .eq('employee_id', employeeId);

      if (availError) {
        console.log('Error deleting availability (may not exist):', availError);
      } else {
        console.log('Deleted employee availability');
      }

      // Delete from time_off_requests (both as employee and as reviewer)
      const { error: timeoffError } = await supabase
        .from('time_off_requests')
        .delete()
        .or(`employee_id.eq.${employeeId},reviewed_by.eq.${employeeId}`);

      if (timeoffError) {
        console.log('Error deleting time-off requests (may not exist):', timeoffError);
      } else {
        console.log('Deleted employee time-off requests');
      }

      // Now try to delete the employee
      console.log('Deleting employee record...');

      const { data, error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId)
        .select();

      console.log('Final delete result:', { data, error });

      if (error) {
        console.error('Final supabase delete error:', error);
        console.error('Error details:', error.details, error.hint, error.code);
        alert('Error deleting employee: ' + error.message + (error.details ? '\nDetails: ' + error.details : ''));
      } else if (!data || data.length === 0) {
        console.error('Final delete - No rows were deleted. Employee may not exist or permission denied.');
        console.log('This is likely due to Row Level Security (RLS) policies in Supabase.');
        console.log('The employee exists but RLS is preventing deletion.');
        
        // Let's try to understand the RLS issue by checking what user we're authenticated as
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('Current authenticated user:', userData);
        console.log('User error:', userError);
        
        alert('Unable to delete employee. This appears to be due to database Row Level Security policies.\n\n' +
              'The employee exists but the database is preventing deletion. ' +
              'Please check your Supabase RLS policies for the employees table.');
      } else {
        console.log('Employee deleted successfully:', data);
        alert('Employee and all related records deleted successfully');
        fetchEmployees(); // Refresh the list
      }
    } catch (err) {
      console.error('Delete employee catch error:', err);
      alert('Failed to delete employee: ' + err.message);
    }
  }

  if (loading) {
    console.log('EmployeeList: Rendering loading state')
    return <div>Loading employees...</div>
  }
  if (error) {
    console.log('EmployeeList: Rendering error state:', error)
    return <div>Error: {error}</div>
  }

  console.log('EmployeeList: Rendering employees, count:', employees.length)

  return (
    <div>
      <h2>Staff Directory</h2>
      {employees.length === 0 && <p style={{ color: theme.textPrimary }}>No employees found.</p>}
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {employees.map((employee) => (
          <div 
            key={employee.id} 
            style={{ 
              border: `1px solid ${theme.border}`, 
              padding: '1rem', 
              borderRadius: '8px',
              backgroundColor: editingEmployee === employee.id ? theme.warningBg : theme.cardBg
            }}
          >
            {editingEmployee === employee.id ? (
              // Edit Mode
              <div>
                <h3 style={{ marginBottom: '1rem', color: theme.warningText }}>Editing Employee</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Full Name:
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name || ''}
                        onChange={(e) => handleEditChange('full_name', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Position:
                      </label>
                      <select
                        value={editForm.position || ''}
                        onChange={(e) => handleEditChange('position', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                      >
                        <option value="Sales Floor">Sales Floor</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Tech">Tech</option>
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Email:
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={cancelEditing}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: theme.bgTertiary,
                        color: theme.primaryText,
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
                        backgroundColor: theme.success,
                        color: theme.primaryText,
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
                  {canManageEmployees() && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => startEditing(employee)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: theme.primary,
                          color: theme.primaryText,
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
                          backgroundColor: theme.danger,
                          color: theme.primaryText,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                {employee.display_name && employee.display_name !== employee.full_name && (
                  <p><strong>Display Name:</strong> {employee.display_name}</p>
                )}
                <p><strong>Position:</strong> {employee.position} <span style={{ color: theme.textSecondary }}>({employee.role})</span></p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Phone:</strong> {employee.phone}</p>
                <p><strong>Hours/Week:</strong> 
                  {employee.minimum_hours_per_week || 'No min'} - {employee.preferred_hours_per_week || 'No pref'} - {employee.maximum_hours_per_week || 'No max'}
                </p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: employee.is_active ? theme.successText : theme.dangerText,
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