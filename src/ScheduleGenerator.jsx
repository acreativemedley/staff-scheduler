import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export default function ScheduleGenerator() {
  const [employees, setEmployees] = useState([]);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [modalDateKey, setModalDateKey] = useState(null);
  const [availableEmployeesForModal, setAvailableEmployeesForModal] = useState([]);

  const daysOfWeek = [
    { id: 0, name: 'Sunday', shortName: 'Sun' },
    { id: 1, name: 'Monday', shortName: 'Mon' },
    { id: 2, name: 'Tuesday', shortName: 'Tue' },
    { id: 3, name: 'Wednesday', shortName: 'Wed' },
    { id: 4, name: 'Thursday', shortName: 'Thu' },
    { id: 5, name: 'Friday', shortName: 'Fri' },
    { id: 6, name: 'Saturday', shortName: 'Sat' }
  ];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (currentWeek && employees.length > 0 && scheduleTemplates.length > 0) {
      generateBaseSchedule();
    }
  }, [currentWeek, employees, scheduleTemplates, timeOffRequests]);

  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchScheduleTemplates(),
        fetchTimeOffRequests()
      ]);
      
      // Set current week to this week's Sunday
      const today = new Date();
      const sunday = getSunday(today);
      setCurrentWeek(formatDateForInput(sunday));
      
      setLoading(false);
    } catch (error) {
      console.error('ScheduleGenerator: Error during initialization:', error);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };

  const fetchScheduleTemplates = async () => {
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week');
    
    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setScheduleTemplates(data || []);
    }
  };

  const fetchTimeOffRequests = async () => {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('status', 'approved');
    
    if (error) {
      console.error('Error fetching time off requests:', error);
    } else {
      setTimeOffRequests(data || []);
    }
  };

  const getSunday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is day 0, so subtract the current day number
    d.setDate(diff);
    return d;
  };

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  const formatDateForInput = (date) => {
    // Handle different date input types
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Fix timezone issue: parse date components manually to avoid UTC interpretation
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      console.error('Invalid date passed to formatDateForInput:', date);
      return new Date().toISOString().split('T')[0];
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date passed to formatDateForInput:', date);
      return new Date().toISOString().split('T')[0];
    }
    
    // Format as YYYY-MM-DD in local time (not UTC)
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDates = (sundayDate) => {
    const dates = [];
    const sunday = new Date(sundayDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const parseDate = (dateStr) => {
    if (typeof dateStr === 'string') {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    return dateStr; // already a Date object
  };

  const isEmployeeOnTimeOff = (employeeId, date) => {
    // Handle both Date objects and date strings
    const dateStr = date instanceof Date ? formatDateForInput(date) : date;
    
    return timeOffRequests.some(request => {
      if (request.employee_id !== employeeId) return false;
      
      const startDate = parseDate(request.start_date);
      const endDate = parseDate(request.end_date);
      const checkDate = parseDate(dateStr);
      
      if (request.request_type === 'full_days') {
        return checkDate >= startDate && checkDate <= endDate;
      } else if (request.request_type === 'partial_day') {
        return checkDate.getTime() === startDate.getTime();
      }
      
      return false;
    });
  };

  const getPartialTimeOff = (employeeId, date) => {
    // Handle both Date objects and date strings
    const dateStr = date instanceof Date ? formatDateForInput(date) : date;
    
    return timeOffRequests.find(request => {
      if (request.employee_id !== employeeId) return false;
      if (request.request_type !== 'partial_day') return false;
      
      const requestDate = parseDate(request.start_date);
      const checkDate = parseDate(dateStr);
      
      return checkDate.getTime() === requestDate.getTime();
    });
  };

  const generateBaseSchedule = useCallback(async () => {
    console.log('Loading predefined base schedule...');
    
    // currentWeek is already the Sunday date, so just parse it
    const currentWeekDate = new Date(currentWeek + 'T00:00:00');

    try {
      console.log('Checking for existing weekly schedule for:', currentWeek);
      
      // First, check if we have a saved weekly schedule for this week
      const { data: existingSchedule, error: existingError } = await supabase
        .from('weekly_schedules')
        .select(`
          id,
          week_start_date,
          employee_id,
          schedule_date,
          start_time,
          end_time,
          position,
          notes,
          is_from_base,
          employees!inner(full_name, position)
        `)
        .eq('week_start_date', currentWeek);

      if (existingError) {
        console.error('Error checking existing schedule:', existingError);
      }

      if (!existingError && existingSchedule && existingSchedule.length > 0) {
        console.log('Found existing weekly schedule:', existingSchedule);
        // Transform the data to match our expected format
        const weeklyScheduleData = existingSchedule.map(entry => ({
          id: entry.id,
          week_start_date: entry.week_start_date,
          employee_id: entry.employee_id,
          employee_name: entry.employees.full_name,
          employee_position: entry.employees.position,
          schedule_date: entry.schedule_date,
          start_time: entry.start_time,
          end_time: entry.end_time,
          position: entry.position,
          job_position: entry.position,
          notes: entry.notes,
          is_from_base: entry.is_from_base
        }));
        buildScheduleFromWeeklyData(weeklyScheduleData, currentWeekDate);
        return;
      }

      // No existing schedule found, generate from base schedule
      console.log('No existing schedule found, generating from base schedule');
      const { data: baseScheduleData, error: baseError } = await supabase
        .rpc('get_base_schedule_for_week', {
          p_week_start_date: currentWeek
        });
        
      if (baseError) {
        console.error('Error fetching base schedule:', baseError);
        alert('Error loading schedule: ' + baseError.message);
        return;
      }
      
      // Use base schedule data if available
      if (baseScheduleData && baseScheduleData.length > 0) {
        console.log('Using base schedule data:', baseScheduleData);
        buildScheduleFromData(baseScheduleData, currentWeekDate);
      } else {
        console.log('No base schedule found');
        alert('No base schedule found. Please set up your base schedule first using the Base Schedule Manager.');
      }

    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Error loading schedule: ' + error.message);
    }
  }, [currentWeek, employees, scheduleTemplates, timeOffRequests]);

  const buildScheduleFromWeeklyData = (weeklyScheduleData, currentWeekDate) => {
    console.log('Building schedule from weekly data:', weeklyScheduleData);
    const schedule = {};
    const weekDates = getWeekDates(currentWeekDate);

    console.log('Week start (Sunday):', currentWeekDate.toDateString());
    console.log('Generated week dates:', weekDates.map(d => `${d.toDateString()} (day ${d.getDay()})`));

    // Initialize each day
    weekDates.forEach((date) => {
      const dateKey = formatDateForInput(date);
      schedule[dateKey] = {
        date: date,
        dayOfWeek: date.getDay(),
        shifts: []
      };
    });

    console.log('Schedule keys initialized:', Object.keys(schedule));

    // Add shifts from weekly schedule data
    let addedShifts = 0;
    weeklyScheduleData.forEach(entry => {
      const dateKey = entry.schedule_date;
      console.log(`Processing entry: ${dateKey} for employee ${entry.employee_id}`);
      
      if (schedule[dateKey]) {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        console.log(`Found employee for ${entry.employee_id}:`, employee?.full_name);
        
        if (employee) {
          const hasTimeOff = isEmployeeOnTimeOff(employee.id, dateKey);
          const partialTimeOff = getPartialTimeOff(employee.id, dateKey);
          
          schedule[dateKey].shifts.push({
            id: entry.id || `${employee.id}-${dateKey}`,
            employee: employee,
            start_time: entry.start_time,
            end_time: entry.end_time,
            position: entry.job_position || entry.position || entry.employee_position,
            conflict: hasTimeOff,
            partialTimeOff: partialTimeOff,
            notes: entry.notes || '',
            isFromBase: entry.is_from_base,
            weeklyScheduleId: entry.id
          });
          addedShifts++;
        } else {
          console.warn(`Employee not found for ID: ${entry.employee_id}`);
        }
      } else {
        console.warn(`Schedule date ${dateKey} not found in initialized schedule`);
      }
    });

    console.log(`Added ${addedShifts} shifts to schedule`);
    console.log('Final schedule:', schedule);
    setWeeklySchedule(schedule);
  };

  const buildScheduleFromData = (baseScheduleData, currentWeekDate) => {
    const schedule = {};
    const weekDates = getWeekDates(currentWeekDate);

    // Initialize each day
    weekDates.forEach((date) => {
      const dateKey = formatDateForInput(date);
      schedule[dateKey] = {
        date: date,
        dayOfWeek: date.getDay(),
        shifts: []
      };
    });

    // Add shifts from base schedule data
    baseScheduleData.forEach(entry => {
      const dateKey = entry.schedule_date;
      if (schedule[dateKey]) {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        
        if (employee) {
          const hasTimeOff = isEmployeeOnTimeOff(employee.id, dateKey);
          const partialTimeOff = getPartialTimeOff(employee.id, dateKey);
          
          schedule[dateKey].shifts.push({
            id: `${employee.id}-${dateKey}`,
            employee: employee,
            start_time: entry.start_time,
            end_time: entry.end_time,
            position: entry.employee_position,
            conflict: hasTimeOff,
            partialTimeOff: partialTimeOff,
            notes: entry.notes
          });
        }
      }
    });

    setWeeklySchedule(schedule);
  };

  const saveWeeklySchedule = async () => {
    setSaving(true);
    setMessage('');

    try {
      console.log('Saving schedule for week:', currentWeek);
      console.log('Weekly schedule data:', weeklySchedule);

      // First, delete any existing entries for this week
      const { error: deleteError } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('week_start_date', currentWeek);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Prepare data for insertion
      const scheduleEntries = [];
      Object.entries(weeklySchedule).forEach(([dateKey, daySchedule]) => {
        daySchedule.shifts.forEach(shift => {
          scheduleEntries.push({
            week_start_date: currentWeek,
            employee_id: shift.employee.id,
            schedule_date: dateKey,
            start_time: shift.start_time,
            end_time: shift.end_time,
            position: shift.position,
            notes: shift.notes || '',
            is_from_base: shift.isFromBase !== false // Default to true if not specified
          });
        });
      });

      console.log('Schedule entries to insert:', scheduleEntries);

      if (scheduleEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('weekly_schedules')
          .insert(scheduleEntries);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        console.log('Successfully inserted', scheduleEntries.length, 'entries');
      }

      setMessage('Schedule saved successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage('Error saving schedule: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateDayShifts = (template, date) => {
    const shifts = [];
    const managers = employees.filter(emp => emp.role === 'manager');
    const staff = employees.filter(emp => emp.role === 'staff');

    // Add managers
    for (let i = 0; i < template.required_managers && i < managers.length; i++) {
      const employee = managers[i];
      const hasTimeOff = isEmployeeOnTimeOff(employee.id, date);
      const partialTimeOff = getPartialTimeOff(employee.id, date);
      
      shifts.push({
        id: `${employee.id}-${formatDateForInput(date)}`,
        employee: employee,
        start_time: template.store_open_time,
        end_time: template.store_close_time,
        position: employee.position,
        conflict: hasTimeOff,
        partialTimeOff: partialTimeOff
      });
    }

    // Add staff
    for (let i = 0; i < template.required_staff && i < staff.length; i++) {
      const employee = staff[i];
      const hasTimeOff = isEmployeeOnTimeOff(employee.id, date);
      const partialTimeOff = getPartialTimeOff(employee.id, date);
      
      shifts.push({
        id: `${employee.id}-${formatDateForInput(date)}`,
        employee: employee,
        start_time: template.store_open_time,
        end_time: template.store_close_time,
        position: employee.position,
        conflict: hasTimeOff,
        partialTimeOff: partialTimeOff
      });
    }

    return shifts;
  };

  const updateShift = (dateKey, shiftId, field, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        shifts: prev[dateKey].shifts.map(shift =>
          shift.id === shiftId ? { ...shift, [field]: value } : shift
        )
      }
    }));
  };

  const removeShift = (dateKey, shiftId) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        shifts: prev[dateKey].shifts.filter(shift => shift.id !== shiftId)
      }
    }));
  };

  const addShift = (dateKey) => {
    const daySchedule = weeklySchedule[dateKey];
    if (!daySchedule) return;

    const availableEmployees = employees.filter(emp => 
      !daySchedule.shifts.some(shift => shift.employee.id === emp.id)
    );

    if (availableEmployees.length === 0) {
      alert('All employees are already scheduled for this day.');
      return;
    }

    // Show modal with available employees
    setAvailableEmployeesForModal(availableEmployees);
    setModalDateKey(dateKey);
    setShowAddEmployeeModal(true);
  };

  const getEmployeeAvailabilityStatus = (employee, dateKey) => {
    const hasFullTimeOff = isEmployeeOnTimeOff(employee.id, dateKey);
    const partialTimeOff = getPartialTimeOff(employee.id, dateKey);
    
    if (hasFullTimeOff) {
      // Find the time-off request for explanation
      const timeOffRequest = timeOffRequests.find(request => {
        if (request.employee_id !== employee.id) return false;
        const startDate = parseDate(request.start_date);
        const endDate = parseDate(request.end_date);
        const checkDate = parseDate(dateKey);
        return request.request_type === 'full_days' && checkDate >= startDate && checkDate <= endDate;
      });
      
      return {
        status: 'unavailable',
        color: '#fef2f2',
        borderColor: '#fecaca',
        textColor: '#dc2626',
        explanation: timeOffRequest?.reason || 'Full day time off'
      };
    }
    
    if (partialTimeOff) {
      const startTime = partialTimeOff.partial_start_time;
      const endTime = partialTimeOff.partial_end_time;
      return {
        status: 'partial',
        color: '#fffbeb',
        borderColor: '#fed7aa',
        textColor: '#d97706',
        explanation: `Partial time off: ${startTime}-${endTime}${partialTimeOff.reason ? ` (${partialTimeOff.reason})` : ''}`
      };
    }
    
    return {
      status: 'available',
      color: '#f0fdf4',
      borderColor: '#bbf7d0',
      textColor: '#16a34a',
      explanation: 'Available'
    };
  };

  const handleEmployeeSelection = (selectedEmployee) => {
    const daySchedule = weeklySchedule[modalDateKey];
    if (!daySchedule || !selectedEmployee) return;

    // Get template for this day of week, or use default times
    const template = scheduleTemplates.find(t => t.day_of_week === daySchedule.dayOfWeek);
    const defaultStartTime = template?.store_open_time || '09:00';
    const defaultEndTime = template?.store_close_time || '17:00';

    const newShift = {
      id: `${selectedEmployee.id}-${modalDateKey}`,
      employee: selectedEmployee,
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      position: selectedEmployee.position,
      conflict: isEmployeeOnTimeOff(selectedEmployee.id, daySchedule.date),
      partialTimeOff: getPartialTimeOff(selectedEmployee.id, daySchedule.date),
      isFromBase: false, // This is a manually added shift
      notes: ''
    };

    setWeeklySchedule(prev => ({
      ...prev,
      [modalDateKey]: {
        ...prev[modalDateKey],
        shifts: [...prev[modalDateKey].shifts, newShift]
      }
    }));

    // Close modal
    setShowAddEmployeeModal(false);
    setModalDateKey(null);
    setAvailableEmployeesForModal([]);
  };

  const closeAddEmployeeModal = () => {
    setShowAddEmployeeModal(false);
    setModalDateKey(null);
    setAvailableEmployeesForModal([]);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const changeWeek = (direction) => {
    // currentWeek is already a Sunday, so just add/subtract weeks
    const currentSunday = new Date(currentWeek + 'T00:00:00');
    currentSunday.setDate(currentSunday.getDate() + (direction * 7));
    setCurrentWeek(formatDateForInput(currentSunday));
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading schedule generator...</div>
      </div>
    );
  }

  if (!currentWeek) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Initializing...</div>
      </div>
    );
  }

  let weekDates;
  try {
    weekDates = getWeekDates(new Date(currentWeek + 'T00:00:00'));
  } catch (error) {
    console.error('ScheduleGenerator: Error generating week dates:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>Error loading schedule: {error.message}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px 12px',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <h2>Weekly Schedule Generator</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Load your predefined base schedule and edit as needed. Time-off conflicts are highlighted in red.
        <strong> Set up your base schedule first using the "Base Schedule" tab.</strong>
      </p>

      {/* Week Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => changeWeek(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Previous Week
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>
            Week of {formatDateHeader(weekDates[0])} - {formatDateHeader(weekDates[6])}
          </h3>
          <input
            type="date"
            value={currentWeek}
            onChange={(e) => {
              // Convert the selected date to the Sunday of that week
              const selectedDate = new Date(e.target.value + 'T00:00:00');
              const sunday = getSunday(selectedDate);
              setCurrentWeek(formatDateForInput(sunday));
            }}
            style={{
              padding: '6px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button
          onClick={() => changeWeek(1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Next Week →
        </button>
      </div>

      {/* Save Schedule Button */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px' 
      }}>
        <button
          onClick={saveWeeklySchedule}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: saving ? '#9ca3af' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '150px'
          }}
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
          color: message.includes('Error') ? '#dc2626' : '#16a34a',
          border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      {/* Weekly Schedule Grid */}
      <div style={{ 
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: 'white',
        width: '100%'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          width: '100%',
          minHeight: '400px'
        }}>
          {weekDates.map((date, index) => {
            const dateKey = formatDateForInput(date);
            const daySchedule = weeklySchedule[dateKey];
            
            return (
              <div
                key={dateKey}
                style={{
                  border: index < 6 ? '0 1px 0 0' : '0',
                  borderStyle: 'solid',
                  borderColor: '#e5e7eb',
                  minHeight: '400px'
                }}
              >
                {/* Day Header */}
                <div style={{
                  padding: '12px 8px',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                    {formatDateHeader(date)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    10:00 AM - 6:00 PM
                  </div>
                </div>

                {/* Day Schedule */}
                <div style={{ padding: '8px' }}>
                  {daySchedule ? (
                    <div>
                      {daySchedule.shifts.map((shift) => (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          dateKey={dateKey}
                          onUpdate={updateShift}
                          onRemove={removeShift}
                          formatTime={formatTime}
                          employees={employees}
                        />
                      ))}
                      
                      <button
                        onClick={() => addShift(dateKey)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginTop: '10px',
                          backgroundColor: '#f3f4f6',
                          border: '1px dashed #9ca3af',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}
                      >
                        + Add Employee
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#9ca3af', 
                      padding: '20px',
                      fontSize: '14px'
                    }}>
                      No template configured
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Legend:</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '3px' }} />
            <span>Time-off Conflict (Full Day)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '3px' }} />
            <span>Partial Day Time-off</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '3px' }} />
            <span>Manager</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '3px' }} />
            <span>Staff</span>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Add Employee to {modalDateKey ? formatDateHeader(new Date(modalDateKey + 'T00:00:00')) : 'Day'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                Select an employee to add to the schedule:
              </p>
              
              {/* Availability Legend */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '8px 12px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>
                  Availability Status:
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: '#16a34a' }}>Available</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#fffbeb', 
                      border: '1px solid #fed7aa', 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: '#d97706' }}>Partial Time Off</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: '#dc2626' }}>Unavailable</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableEmployeesForModal.map(employee => {
                  const availability = getEmployeeAvailabilityStatus(employee, modalDateKey);
                  
                  return (
                    <button
                      key={employee.id}
                      onClick={() => handleEmployeeSelection(employee)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: availability.color,
                        border: `1px solid ${availability.borderColor}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {employee.full_name}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: availability.textColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {availability.status === 'available' ? 'AVAILABLE' : 
                           availability.status === 'partial' ? 'PARTIAL' : 'UNAVAILABLE'}
                        </div>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
                        {employee.position} • {employee.role}
                      </div>
                      <div style={{ 
                        color: availability.textColor, 
                        fontSize: '11px', 
                        fontStyle: availability.status !== 'available' ? 'italic' : 'normal',
                        fontWeight: availability.status !== 'available' ? 'bold' : 'normal'
                      }}>
                        {availability.explanation}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeAddEmployeeModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftCard({ shift, dateKey, onUpdate, onRemove, formatTime, employees }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValues, setTempValues] = useState({
    employee_id: shift.employee.id,
    start_time: shift.start_time,
    end_time: shift.end_time
  });

  const getShiftBackgroundColor = () => {
    if (shift.conflict) return '#fef2f2'; // Red for full day conflicts
    if (shift.partialTimeOff) return '#fffbeb'; // Yellow for partial conflicts
    if (shift.employee.role === 'manager') return '#f0f9ff'; // Blue for managers
    return '#f0fdf4'; // Green for staff
  };

  const getBorderColor = () => {
    if (shift.conflict) return '#fecaca';
    if (shift.partialTimeOff) return '#fed7aa';
    if (shift.employee.role === 'manager') return '#bae6fd';
    return '#bbf7d0';
  };

  const handleSave = () => {
    const selectedEmployee = employees.find(emp => emp.id === tempValues.employee_id);
    onUpdate(dateKey, shift.id, 'employee', selectedEmployee);
    onUpdate(dateKey, shift.id, 'start_time', tempValues.start_time);
    onUpdate(dateKey, shift.id, 'end_time', tempValues.end_time);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValues({
      employee_id: shift.employee.id,
      start_time: shift.start_time,
      end_time: shift.end_time
    });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        backgroundColor: getShiftBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '8px',
        fontSize: '12px'
      }}
    >
      {isEditing ? (
        <div>
          <select
            value={tempValues.employee_id}
            onChange={(e) => setTempValues(prev => ({ ...prev, employee_id: e.target.value }))}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '12px',
              marginBottom: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.display_name || emp.full_name} ({emp.position})
              </option>
            ))}
          </select>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}>
            <input
              type="time"
              value={tempValues.start_time}
              onChange={(e) => setTempValues(prev => ({ ...prev, start_time: e.target.value }))}
              style={{
                padding: '4px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
            <input
              type="time"
              value={tempValues.end_time}
              onChange={(e) => setTempValues(prev => ({ ...prev, end_time: e.target.value }))}
              style={{
                padding: '4px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '4px 8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '4px 8px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {shift.employee.display_name || shift.employee.full_name}
          </div>
          <div style={{ color: '#6b7280', marginBottom: '4px' }}>
            {shift.employee.position}
          </div>
          <div style={{ marginBottom: '8px' }}>
            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
          </div>
          
          {shift.conflict && (
            <div style={{ color: '#dc2626', fontSize: '11px', marginBottom: '4px' }}>
              ⚠️ Full Day Time-off
            </div>
          )}
          
          {shift.partialTimeOff && (
            <div style={{ color: '#d97706', fontSize: '11px', marginBottom: '4px' }}>
              ⚠️ Available: {formatTime(shift.partialTimeOff.partial_start_time)} - {formatTime(shift.partialTimeOff.partial_end_time)}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1,
                padding: '4px 8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(dateKey, shift.id)}
              style={{
                flex: 1,
                padding: '4px 8px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}