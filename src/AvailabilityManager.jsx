import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useUser } from './UserContext-Minimal';
import { theme } from './theme';

export default function AvailabilityManager() {
  const { userProfile, canManageEmployees } = useUser();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availability, setAvailability] = useState({});
  const [hoursPreferences, setHoursPreferences] = useState({
    minimum_hours_per_week: '',
    preferred_hours_per_week: '',
    maximum_hours_per_week: ''
  });
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
      .select('id, full_name, display_name, position, minimum_hours_per_week, preferred_hours_per_week, maximum_hours_per_week')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
      
      // If user is staff and has a linked employee_id, auto-select it
      if (!canManageEmployees() && userProfile?.employee_id && data) {
        const linkedEmployee = data.find(emp => emp.id === userProfile.employee_id);
        if (linkedEmployee) {
          setSelectedEmployee(linkedEmployee.id);
        }
      }
    }
  };

  const fetchEmployeeAvailability = async (employeeId) => {
    setLoading(true);
    
    // Fetch availability data
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
    
    // Fetch employee hours preferences
    const { data: employeeData, error: empError } = await supabase
      .from('employees')
      .select('minimum_hours_per_week, preferred_hours_per_week, maximum_hours_per_week')
      .eq('id', employeeId)
      .single();
    
    if (empError) {
      console.error('Error fetching employee hours:', empError);
    } else if (employeeData) {
      setHoursPreferences({
        minimum_hours_per_week: employeeData.minimum_hours_per_week || '',
        preferred_hours_per_week: employeeData.preferred_hours_per_week || '',
        maximum_hours_per_week: employeeData.maximum_hours_per_week || ''
      });
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
      
      // Update employee hours preferences
      const { error: hoursError } = await supabase
        .from('employees')
        .update({
          minimum_hours_per_week: hoursPreferences.minimum_hours_per_week || null,
          preferred_hours_per_week: hoursPreferences.preferred_hours_per_week || null,
          maximum_hours_per_week: hoursPreferences.maximum_hours_per_week || null
        })
        .eq('id', selectedEmployee);
      
      if (hoursError) throw hoursError;

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
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (!status) return isDark ? theme.inputBg : '#e5e7eb';
    
    // Dark mode: use darker backgrounds with lighter text
    // Light mode: use bright backgrounds with dark text
    if (isDark) {
      switch(status) {
        case 'green': return '#166534'; // dark green
        case 'yellow': return '#854d0e'; // dark yellow/orange
        case 'red': return '#991b1b'; // dark red
        default: return theme.inputBg;
      }
    } else {
      switch(status) {
        case 'green': return '#4ade80'; // bright green
        case 'yellow': return '#fbbf24'; // bright yellow
        case 'red': return '#f87171'; // bright red
        default: return '#e5e7eb';
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: theme.textPrimary }}>
      <h2>Employee Availability Manager</h2>
      <p>Set employee availability by day of the week with time constraints.</p>

      {/* Employee Selection */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: theme.labelColor }}>
          {canManageEmployees() ? 'Select Employee:' : 'Your Availability:'}
        </label>
        {canManageEmployees() ? (
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{
              width: '300px',
              padding: '10px',
              fontSize: '16px',
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: '5px',
              backgroundColor: theme.inputBg,
              color: theme.textPrimary
            }}
          >
            <option value="">Choose an employee...</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.display_name || employee.full_name} ({employee.position})
              </option>
            ))}
          </select>
        ) : (
          <div style={{
            width: '300px',
            padding: '10px',
            fontSize: '16px',
            border: `1px solid ${theme.borderLight}`,
            borderRadius: '5px',
            backgroundColor: theme.inputDisabledBg,
            color: theme.textPrimary
          }}>
            {employees.find(emp => emp.id === selectedEmployee)?.full_name || 'Not linked to an employee'}
          </div>
        )}
        {!canManageEmployees() && !selectedEmployee && (
          <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px' }}>
            Your account is not linked to an employee. Please contact an administrator.
          </p>
        )}
      </div>

      {selectedEmployee && (
        <div>
          {/* Hours Preferences Section */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            backgroundColor: theme.cardBg
          }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>Weekly Hours Preferences</h3>
            <p style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '15px' }}>
              Set your preferred working hours per week. This helps managers create schedules that match your availability.
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px' 
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.labelColor }}>
                  Minimum Hours/Week:
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={hoursPreferences.minimum_hours_per_week}
                  onChange={(e) => setHoursPreferences(prev => ({
                    ...prev,
                    minimum_hours_per_week: e.target.value
                  }))}
                  placeholder="e.g., 15"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary
                  }}
                />
                <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '5px', marginBottom: 0 }}>
                  Minimum hours you prefer
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.labelColor }}>
                  Ideal Hours/Week:
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={hoursPreferences.preferred_hours_per_week}
                  onChange={(e) => setHoursPreferences(prev => ({
                    ...prev,
                    preferred_hours_per_week: e.target.value
                  }))}
                  placeholder="e.g., 30"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary
                  }}
                />
                <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '5px', marginBottom: 0 }}>
                  Your ideal hours
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.labelColor }}>
                  Maximum Hours/Week:
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={hoursPreferences.maximum_hours_per_week}
                  onChange={(e) => setHoursPreferences(prev => ({
                    ...prev,
                    maximum_hours_per_week: e.target.value
                  }))}
                  placeholder="e.g., 40"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary
                  }}
                />
                <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '5px', marginBottom: 0 }}>
                  Maximum hours you prefer
                </p>
              </div>
            </div>
          </div>
          
          <h3>Weekly Availability</h3>
          <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
            {daysOfWeek.map(day => {
              const dayAvailability = availability[day.id] || {};
              return (
                <div
                  key={day.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: theme.cardBg
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 15px 0',
                    color: theme.textPrimary,
                    borderBottom: `2px solid ${theme.borderLight}`,
                    paddingBottom: '5px'
                  }}>
                    {day.name}
                  </h4>
                  
                  {/* Status Selection */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.labelColor }}>
                      Availability Status:
                    </label>
                    <select
                      value={dayAvailability.status || ''}
                      onChange={(e) => updateDayAvailability(day.id, 'status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(dayAvailability.status),
                        color: theme.textPrimary
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
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: theme.labelColor }}>
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
                            border: `1px solid ${theme.inputBorder}`,
                            borderRadius: '4px',
                            backgroundColor: theme.inputBg,
                            color: theme.textPrimary
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: theme.labelColor }}>
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
                            border: `1px solid ${theme.inputBorder}`,
                            borderRadius: '4px',
                            backgroundColor: theme.inputBg,
                            color: theme.textPrimary
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: theme.labelColor }}>
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
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: '4px',
                        resize: 'vertical',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary
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