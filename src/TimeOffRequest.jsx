import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { parseDate } from './dateUtils';
import { useUser } from './UserContext-Minimal';
import { theme } from './theme';

export default function TimeOffRequest() {
  const { userProfile, canManageEmployees } = useUser();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    request_type: 'full_days',
    partial_start_time: '',
    partial_end_time: '',
    reason: '',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_interval: 1,
    recurrence_end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // parseDate function is now imported from dateUtils.js

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, display_name, position')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
      
      // If user is staff and has a linked employee_id, auto-select it
      if (!canManageEmployees() && userProfile?.employee_id && data) {
        const linkedEmployee = data.find(emp => emp.id === userProfile.employee_id);
        if (linkedEmployee) {
          setFormData(prev => ({
            ...prev,
            employee_id: linkedEmployee.id
          }));
        }
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-set end_date to start_date for partial day requests
    if (field === 'request_type' && value === 'partial_day') {
      setFormData(prev => ({
        ...prev,
        end_date: prev.start_date
      }));
    }

    // Clear partial times when switching to full days
    if (field === 'request_type' && value === 'full_days') {
      setFormData(prev => ({
        ...prev,
        partial_start_time: '',
        partial_end_time: ''
      }));
    }

    // Auto-set end_date when start_date changes for partial day
    if (field === 'start_date' && formData.request_type === 'partial_day') {
      setFormData(prev => ({
        ...prev,
        end_date: value
      }));
    }

    // Check advance notice after state update
    setTimeout(() => {
      if (field === 'start_date' || (field === 'request_type' && value === 'partial_day')) {
        checkAdvanceNotice();
      }
    }, 0);
  };

  const validateForm = () => {
    if (!formData.employee_id || !formData.start_date) {
      return 'Please fill in all required fields.';
    }

    // For non-recurring requests, validate end_date
    if (!formData.is_recurring && !formData.end_date) {
      return 'Please specify an end date.';
    }

    // For recurring requests, validate recurrence_end_date
    if (formData.is_recurring && !formData.recurrence_end_date) {
      return 'Please specify when the recurring pattern should end.';
    }

    if (!formData.is_recurring && parseDate(formData.end_date) < parseDate(formData.start_date)) {
      return 'End date cannot be before start date.';
    }

    if (formData.is_recurring && parseDate(formData.recurrence_end_date) < parseDate(formData.start_date)) {
      return 'Recurrence end date cannot be before start date.';
    }

    if (formData.request_type === 'partial_day') {
      if (!formData.is_recurring && formData.start_date !== formData.end_date) {
        return 'Partial day requests must be for a single day.';
      }
      if (!formData.partial_start_time || !formData.partial_end_time) {
        return 'Please specify start and end times for partial day requests.';
      }
      if (formData.partial_end_time <= formData.partial_start_time) {
        return 'End time must be after start time.';
      }
    }

    return null;
  };

  const checkAdvanceNotice = () => {
    if (!formData.start_date) {
      setWarningMessage('');
      return;
    }

    const today = new Date();
    const startDate = parseDate(formData.start_date);
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(today.getDate() + 28);
    
    if (startDate < fourWeeksFromNow) {
      const daysNotice = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
      setWarningMessage(`⚠️ Short Notice: This request is ${daysNotice} day${daysNotice !== 1 ? 's' : ''} in advance. For better schedule planning, we recommend 4+ weeks notice.`);
    } else {
      setWarningMessage('');
    }
  };

  const submitRequest = async () => {
    const validationError = validateForm();
    if (validationError) {
      // Only show alert for actual validation errors
      alert('⚠️ Form Validation Error\n\n' + validationError);
      setMessage(validationError);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setLoading(true);
    setMessage('');
    setWarningMessage(''); // Clear warning on submit

    try {
      const requestData = {
        employee_id: formData.employee_id,
        start_date: formData.start_date,
        end_date: formData.is_recurring ? formData.start_date : formData.end_date,
        request_type: formData.request_type,
        reason: formData.reason || null,
        is_recurring: formData.is_recurring
      };

      // Add recurring pattern fields
      if (formData.is_recurring) {
        requestData.recurrence_pattern = formData.recurrence_pattern;
        requestData.recurrence_interval = formData.recurrence_interval;
        requestData.recurrence_start_date = formData.start_date;
        requestData.recurrence_end_date = formData.recurrence_end_date;
      }

      // Only include partial times for partial_day requests
      if (formData.request_type === 'partial_day') {
        requestData.partial_start_time = formData.partial_start_time;
        requestData.partial_end_time = formData.partial_end_time;
      }

      console.log('Submitting request data:', requestData);

      const { data, error } = await supabase
        .from('time_off_requests')
        .insert([requestData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully inserted:', data);
      
      // Generate recurring instances if this is a recurring request
      if (formData.is_recurring && data && data[0]) {
        try {
          const { data: functionResult, error: functionError } = await supabase
            .rpc('generate_recurring_time_off_instances', {
              p_request_id: data[0].id,
              p_generate_until_date: formData.recurrence_end_date
            });
          
          if (functionError) {
            console.error('Error generating recurring instances:', functionError);
            setMessage('Time-off request submitted, but there was an issue generating recurring instances. Please contact an administrator.');
          } else {
            setMessage(`Recurring time-off request submitted successfully! Generated ${functionResult} instances.`);
          }
        } catch (funcError) {
          console.error('Function call error:', funcError);
          setMessage('Time-off request submitted, but recurring instances may not have been generated properly.');
        }
      } else {
        setMessage('Time-off request submitted successfully!');
      }
      
      // Reset form but preserve employee_id for staff users
      const preservedEmployeeId = !canManageEmployees() && userProfile?.employee_id 
        ? userProfile.employee_id 
        : '';
      
      setFormData({
        employee_id: preservedEmployeeId,
        start_date: '',
        end_date: '',
        request_type: 'full_days',
        partial_start_time: '',
        partial_end_time: '',
        reason: '',
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_interval: 1,
        recurrence_end_date: ''
      });

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage = 'Error submitting request: ' + error.message;
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    }
    
    setLoading(false);
  };

  const formatDateForInput = (date) => {
    const today = new Date();
    today.setDate(today.getDate() + date);
    return today.toISOString().split('T')[0];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: theme.textPrimary }}>Submit Time-Off Request</h2>
      <p style={{ marginBottom: '30px', color: theme.textSecondary }}>
        Submit requests for full days off or partial days with specific times.
      </p>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Employee Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Employee: *
          </label>
          {canManageEmployees() ? (
            <select
              value={formData.employee_id}
              onChange={(e) => handleInputChange('employee_id', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '5px'
              }}
            >
              <option value="">Select employee...</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.display_name || employee.full_name} ({employee.position})
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: '5px',
              backgroundColor: theme.bgSecondary,
              color: theme.textPrimary
            }}>
              {employees.find(emp => emp.id === formData.employee_id)?.full_name || 'Not linked to an employee'}
            </div>
          )}
          {!canManageEmployees() && !formData.employee_id && (
            <p style={{ color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fca5a5' : '#dc2626', fontSize: '14px', marginTop: '4px' }}>
              Your account is not linked to an employee. Please contact an administrator.
            </p>
          )}
        </div>

        {/* Request Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Request Type: *
          </label>
          <select
            value={formData.request_type}
            onChange={(e) => handleInputChange('request_type', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '5px'
            }}
          >
            <option value="full_days">Full Day(s) Off</option>
            <option value="partial_day">Partial Day (Single Day with Times)</option>
          </select>
        </div>

        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: formData.is_recurring ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              {formData.is_recurring ? 'Pattern Start Date: *' : 'Start Date: *'}
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              min={formatDateForInput(0)} // Today
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '5px'
              }}
            />
            {formData.is_recurring && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                The first occurrence of your recurring time-off pattern
              </p>
            )}
          </div>
          {!formData.is_recurring && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                End Date: *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date || formatDateForInput(0)}
                disabled={formData.request_type === 'partial_day'}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '5px',
                  backgroundColor: formData.request_type === 'partial_day' ? theme.bgSecondary : theme.inputBg,
                  color: theme.textPrimary,
                  cursor: formData.request_type === 'partial_day' ? 'not-allowed' : 'default'
                }}
              />
              {formData.request_type === 'partial_day' && (
                <p style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
                  End date automatically matches start date for partial days
                </p>
              )}
            </div>
          )}
        </div>

        {/* Partial Day Times */}
        {formData.request_type === 'partial_day' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: theme.textPrimary }}>Available Times (when you CAN work)</h4>
            <p style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '15px' }}>
              Specify the hours you ARE available to work on this day. You'll be off during all other hours.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Available From: *
                </label>
                <input
                  type="time"
                  value={formData.partial_start_time}
                  onChange={(e) => handleInputChange('partial_start_time', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '5px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Available Until: *
                </label>
                <input
                  type="time"
                  value={formData.partial_end_time}
                  onChange={(e) => handleInputChange('partial_end_time', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
            <div style={{ 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <strong>Example:</strong> If you set "Available From 2:00 PM to 6:00 PM", you'll be requesting time off from store opening until 2:00 PM and from 6:00 PM until store closing.
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Reason (optional):
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="e.g., Doctor's appointment, family event, vacation..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Recurring Pattern */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              id="is-recurring"
              checked={formData.is_recurring}
              onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label htmlFor="is-recurring" style={{ fontWeight: 'bold', fontSize: '16px' }}>
              Make this a recurring pattern
            </label>
          </div>
          
          {formData.is_recurring && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              display: 'grid',
              gap: '15px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Pattern: *
                  </label>
                  <select
                    value={formData.recurrence_pattern}
                    onChange={(e) => handleInputChange('recurrence_pattern', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px'
                    }}
                  >
                    <option value="weekly">Every Week</option>
                    <option value="biweekly">Every Other Week (Bi-weekly)</option>
                    <option value="monthly">Once a Month</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Interval:
                  </label>
                  <select
                    value={formData.recurrence_interval}
                    onChange={(e) => handleInputChange('recurrence_interval', parseInt(e.target.value))}
                    disabled={formData.recurrence_pattern === 'biweekly'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px',
                      backgroundColor: formData.recurrence_pattern === 'biweekly' ? '#f3f4f6' : 'white'
                    }}
                  >
                    {formData.recurrence_pattern === 'weekly' && (
                      <>
                        <option value="1">Every week</option>
                        <option value="2">Every 2 weeks</option>
                        <option value="3">Every 3 weeks</option>
                      </>
                    )}
                    {formData.recurrence_pattern === 'monthly' && (
                      <>
                        <option value="1">Every month</option>
                        <option value="2">Every 2 months</option>
                        <option value="3">Every 3 months</option>
                      </>
                    )}
                    {formData.recurrence_pattern === 'biweekly' && (
                      <option value="2">Every 2 weeks</option>
                    )}
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Stop Recurring After: *
                </label>
                <input
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) => handleInputChange('recurrence_end_date', e.target.value)}
                  min={formData.start_date || formatDateForInput(7)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '5px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  The recurring pattern will stop generating instances after this date
                </p>
              </div>
              
              <div style={{ 
                padding: '10px',
                backgroundColor: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '5px',
                fontSize: '14px'
              }}>
                <strong>Preview:</strong> {formData.recurrence_pattern === 'weekly' && `Every ${formData.recurrence_interval} week${formData.recurrence_interval > 1 ? 's' : ''}`}
                {formData.recurrence_pattern === 'biweekly' && 'Every other week (every 2 weeks)'}
                {formData.recurrence_pattern === 'monthly' && `Every ${formData.recurrence_interval} month${formData.recurrence_interval > 1 ? 's' : ''}`}
                {formData.start_date && formData.recurrence_end_date && ` from ${formData.start_date} until ${formData.recurrence_end_date}`}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={submitRequest}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              padding: '12px 30px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            textAlign: 'center',
            backgroundColor: message.includes('Error') 
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#991b1b' : '#fef2f2')
              : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#166534' : '#f0fdf4'),
            color: message.includes('Error') 
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fca5a5' : '#dc2626')
              : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#86efac' : '#16a34a'),
            border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}

        {/* Warning Message */}
        {warningMessage && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            textAlign: 'center',
            backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#854d0e' : '#fffbeb',
            color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fde68a' : '#d97706',
            border: '1px solid #fed7aa',
            fontWeight: 'bold'
          }}>
            {warningMessage}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: theme.cardBg, borderRadius: '8px' }}>
        <h4 style={{ color: theme.textPrimary }}>Quick Actions (Recommended: 4+ weeks in advance):</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={() => handleInputChange('start_date', formatDateForInput(28))}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📅 4 Weeks From Now
          </button>
          <button
            onClick={() => handleInputChange('start_date', formatDateForInput(35))}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📅 5 Weeks From Now
          </button>
          <button
            onClick={() => {
              const sixWeeks = formatDateForInput(42);
              handleInputChange('start_date', sixWeeks);
              if (formData.request_type === 'full_days') {
                handleInputChange('end_date', sixWeeks);
              }
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📅 6 Weeks From Now
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', fontStyle: 'italic' }}>
          💡 Tip: Submitting requests 4+ weeks in advance helps with better schedule planning and coverage.
        </p>
      </div>
    </div>
  );
}