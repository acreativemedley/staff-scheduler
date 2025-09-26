import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function AvailabilityManager() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  const statusOptions = [
    { value: 'green', label: 'GREEN (Available)', color: '#4ade80' },
    { value: 'yellow', label: 'YELLOW (Limited)', color: '#fbbf24' },
    { value: 'red', label: 'RED (Unavailable)', color: '#f87171' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeAvailability(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, display_name, position')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };

  const fetchEmployeeAvailability = async (employeeId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employeeId);
    
    if (error) {
      console.error('Error fetching availability:', error);
    } else {
      // Convert array to object keyed by day_of_week for easier management
      const availabilityObj = {};
      data.forEach(item => {
        availabilityObj[item.day_of_week] = {
          status: item.status,
          earliest_start_time: item.earliest_start_time || '',
          latest_end_time: item.latest_end_time || '',
          notes: item.notes || ''
        };
      });
      setAvailability(availabilityObj);
    }
    setLoading(false);
  };

  const updateDayAvailability = (dayId, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  const saveAvailability = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    setSaveMessage('');

    try {
      // First, delete existing availability for this employee
      await supabase
        .from('employee_availability')
        .delete()
        .eq('employee_id', selectedEmployee);

      // Then insert the new availability data
      const availabilityData = [];
      Object.entries(availability).forEach(([dayId, data]) => {
        if (data.status) { // Only save if status is set
          availabilityData.push({
            employee_id: selectedEmployee,
            day_of_week: parseInt(dayId),
            status: data.status,
            earliest_start_time: data.earliest_start_time || null,
            latest_end_time: data.latest_end_time || null,
            notes: data.notes || null
          });
        }
      });

      if (availabilityData.length > 0) {
        const { error } = await supabase
          .from('employee_availability')
          .insert(availabilityData);

        if (error) throw error;
      }

      setSaveMessage('Availability saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving availability:', error);
      setSaveMessage('Error saving availability: ' + error.message);
      setTimeout(() => setSaveMessage(''), 5000);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : '#e5e7eb';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Employee Availability Manager</h2>
      <p>Set employee availability by day of the week with time constraints.</p>

      {/* Employee Selection */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select Employee:
        </label>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          style={{
            width: '300px',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '5px'
          }}
        >
          <option value="">Choose an employee...</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.display_name || employee.full_name} ({employee.position})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div>
          <h3>Weekly Availability</h3>
          <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
            {daysOfWeek.map(day => {
              const dayAvailability = availability[day.id] || {};
              return (
                <div
                  key={day.id}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 15px 0',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '5px'
                  }}>
                    {day.name}
                  </h4>
                  
                  {/* Status Selection */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Availability Status:
                    </label>
                    <select
                      value={dayAvailability.status || ''}
                      onChange={(e) => updateDayAvailability(day.id, 'status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(dayAvailability.status)
                      }}
                    >
                      <option value="">Select status...</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Constraints - only show if status is green or yellow */}
                  {(dayAvailability.status === 'green' || dayAvailability.status === 'yellow') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          Earliest Start Time:
                        </label>
                        <input
                          type="time"
                          value={dayAvailability.earliest_start_time || ''}
                          onChange={(e) => updateDayAvailability(day.id, 'earliest_start_time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          Latest End Time:
                        </label>
                        <input
                          type="time"
                          value={dayAvailability.latest_end_time || ''}
                          onChange={(e) => updateDayAvailability(day.id, 'latest_end_time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Notes (optional):
                    </label>
                    <textarea
                      value={dayAvailability.notes || ''}
                      onChange={(e) => updateDayAvailability(day.id, 'notes', e.target.value)}
                      placeholder="e.g., 'Can't work past 3 PM on this day', 'Prefer morning shifts', etc."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '6px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={saveAvailability}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Saving...' : 'Save Availability'}
            </button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              backgroundColor: saveMessage.includes('Error') ? '#fef2f2' : '#f0fdf4',
              color: saveMessage.includes('Error') ? '#dc2626' : '#16a34a',
              border: `1px solid ${saveMessage.includes('Error') ? '#fecaca' : '#bbf7d0'}`
            }}>
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h4>Status Legend:</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {statusOptions.map(option => (
            <div key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: option.color,
                borderRadius: '4px'
              }} />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
          <strong>GREEN:</strong> Fully available with optional time constraints<br/>
          <strong>YELLOW:</strong> Limited availability (specify constraints in notes)<br/>
          <strong>RED:</strong> Not available for this day
        </p>
      </div>
    </div>
  );
}