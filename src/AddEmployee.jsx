import { useState } from 'react'
import { supabase } from './supabase'

function AddEmployee({ onEmployeeAdded }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    phone: '',
    position: 'Sales Floor',
    role: 'staff',
    preferred_hours_per_week: 40,
    minimum_hours_per_week: 20,
    maximum_hours_per_week: 50,
    notes: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([formData])
        .select()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Employee added successfully!')
        setFormData({
          full_name: '',
          display_name: '',
          email: '',
          phone: '',
          position: 'Sales Floor',
          role: 'staff',
          preferred_hours_per_week: 40,
          minimum_hours_per_week: 20,
          maximum_hours_per_week: 50,
          notes: ''
        })
        if (onEmployeeAdded) {
          onEmployeeAdded(data[0])
        }
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Add New Employee</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name:</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Display Name:</label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="Name to show on schedules (e.g., 'Miranda', 'M. Smith')"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>Optional - how this person's name appears on schedules</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone:</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Position:</label>
          <select
            name="position"
            value={formData.position}
            onChange={(e) => {
              const newPosition = e.target.value
              setFormData(prev => ({
                ...prev,
                position: newPosition,
                role: ['Manager', 'Owner'].includes(newPosition) ? 'manager' : 'staff'
              }))
            }}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="Sales Floor">Sales Floor</option>
            <option value="Teacher">Teacher</option>
            <option value="Manager">Manager</option>
            <option value="Owner">Owner</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            disabled
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
          <small style={{ color: '#666' }}>Role is automatically set based on position</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hours Per Week:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9em', color: '#666' }}>Minimum:</label>
              <input
                type="number"
                name="minimum_hours_per_week"
                value={formData.minimum_hours_per_week}
                onChange={handleInputChange}
                min="1"
                max="60"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9em', color: '#666' }}>Preferred:</label>
              <input
                type="number"
                name="preferred_hours_per_week"
                value={formData.preferred_hours_per_week}
                onChange={handleInputChange}
                min="1"
                max="60"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9em', color: '#666' }}>Maximum:</label>
              <input
                type="number"
                name="maximum_hours_per_week"
                value={formData.maximum_hours_per_week}
                onChange={handleInputChange}
                min="1"
                max="60"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Notes:</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Any additional notes about scheduling preferences, class schedules, etc..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Employee'}
        </button>
      </form>

      {message && (
        <div style={{
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '4px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          color: message.includes('Error') ? '#c33' : '#363',
          border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

export default AddEmployee