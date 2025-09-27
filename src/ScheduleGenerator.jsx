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
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [currentMonth, setCurrentMonth] = useState('');
  const [calendarEvents, setCalendarEvents] = useState({});

  const GOOGLE_CALENDAR_ID = 'fc4e0d1faabf03c4e7f0934b1087b4b244bda5f8d76bc3ae7f278e02e21d82eb@group.calendar.google.com';

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

  useEffect(() => {
    if (currentWeek) {
      const weekStart = new Date(currentWeek + 'T00:00:00');
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999); // End of day
      
      fetchGoogleCalendarEvents(weekStart, weekEnd);
    }
  }, [currentWeek]);

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
      
      // Set current month to this month's first day
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setCurrentMonth(formatDateForInput(firstOfMonth));
      
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

  const fetchGoogleCalendarEvents = async (startDate, endDate) => {
    try {
      console.log('Fetching actual Google Calendar events for:', startDate, 'to', endDate);
      
      // Try direct Google Calendar API approach for public calendar
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      // For public calendars, we can try the Calendar API without a key
      const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `orderBy=startTime&` +
        `singleEvents=true`;

      console.log('Trying Calendar API URL:', calendarApiUrl);

      try {
        const response = await fetch(calendarApiUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Calendar API response:', data);
          
          const events = {};

          // Group events by date
          data.items?.forEach(event => {
            if (event.start && event.summary) {
              let eventDate;
              
              // Handle all-day events
              if (event.start.date) {
                eventDate = new Date(event.start.date + 'T00:00:00');
              } else if (event.start.dateTime) {
                eventDate = new Date(event.start.dateTime);
              } else {
                return; // Skip events without valid dates
              }

              const dateKey = formatDateForInput(eventDate);
              
              if (!events[dateKey]) {
                events[dateKey] = [];
              }

              const eventData = {
                id: event.id,
                title: event.summary,
                description: event.description || '',
                isAllDay: !!event.start.date,
                startTime: event.start.date ? null : event.start.dateTime,
                endTime: event.end?.date ? null : event.end?.dateTime
              };

              events[dateKey].push(eventData);
            }
          });

          console.log('Processed calendar events:', events);
          setCalendarEvents(events);
          return; // Success, exit function
        } else {
          console.log('Calendar API failed with status:', response.status);
          throw new Error(`Calendar API failed: ${response.status}`);
        }
      } catch (apiError) {
        console.log('Calendar API approach failed:', apiError.message);
      }

      // Fallback: Try using CORS proxy with the iCal feed
      console.log('Trying iCal feed with CORS proxy...');
      
      const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icalUrl)}`;
      
      console.log('Proxy URL:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl);
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        console.log('Proxy response status:', proxyData.status);
        
        if (proxyData.contents) {
          console.log('iCal data received, length:', proxyData.contents.length);
          
          let icalData = proxyData.contents;
          
          // Check if the data is base64 encoded
          if (icalData.startsWith('data:text/calendar') && icalData.includes('base64,')) {
            console.log('Detected base64 encoded data, decoding...');
            const base64Data = icalData.split('base64,')[1];
            try {
              icalData = atob(base64Data);
              console.log('Successfully decoded base64 data, new length:', icalData.length);
            } catch (decodeError) {
              console.error('Failed to decode base64 data:', decodeError);
              throw decodeError;
            }
          }
          
          const events = parseSimpleICS(icalData, startDate, endDate);
          console.log('Parsed iCal events:', events);
          setCalendarEvents(events);
          return;
        }
      }

      throw new Error('All methods failed');

    } catch (error) {
      console.error('All Google Calendar methods failed:', error);
      console.log('Using fallback mock data...');
      
      // Fallback to mock data
      const weekStart = new Date(startDate);
      const mockEvents = {
        [formatDateForInput(weekStart)]: [
          {
            id: 'mock1',
            title: 'Store Manager Meeting (Mock)',
            isAllDay: false,
            startTime: weekStart.toISOString().split('T')[0] + 'T10:00:00',
            endTime: weekStart.toISOString().split('T')[0] + 'T11:00:00'
          }
        ]
      };

      setCalendarEvents(mockEvents);
    }
  };

  // Simple ICS parser for basic event extraction
  const parseSimpleICS = (icsText, startDate, endDate) => {
    const events = {};
    
    // Handle different line ending formats (Windows \r\n, Unix \n, Mac \r)
    const lines = icsText.split(/\r\n|\r|\n/);
    let currentEvent = {};
    let inEvent = false;
    
    console.log('Parsing ICS with', lines.length, 'lines');
    console.log('First few lines:', lines.slice(0, 10));
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        console.log('Found event start');
      } else if (line === 'END:VEVENT' && inEvent) {
        inEvent = false;
        console.log('Event ended, processing:', currentEvent);
        
        // Process completed event
        if (currentEvent.summary && currentEvent.dtstart) {
          try {
            const eventDate = parseICSDateTime(currentEvent.dtstart);
            console.log('Parsed event date:', eventDate, 'for event:', currentEvent.summary);
            
            if (eventDate && eventDate >= startDate && eventDate <= endDate) {
              const dateKey = formatDateForInput(eventDate);
              console.log('Event in date range, adding to:', dateKey);
              
              if (!events[dateKey]) {
                events[dateKey] = [];
              }
              
              events[dateKey].push({
                id: currentEvent.uid || `event-${Date.now()}-${Math.random()}`,
                title: currentEvent.summary,
                description: currentEvent.description || '',
                isAllDay: !currentEvent.dtstart.includes('T'),
                startTime: currentEvent.dtstart.includes('T') ? eventDate.toISOString() : null,
                endTime: currentEvent.dtend && currentEvent.dtend.includes('T') ? 
                  parseICSDateTime(currentEvent.dtend)?.toISOString() : null
              });
              
              console.log('Added event:', currentEvent.summary, 'to', dateKey);
            } else {
              console.log('Event outside date range:', eventDate, 'not between', startDate, 'and', endDate);
            }
          } catch (parseError) {
            console.warn('Error parsing event:', parseError, currentEvent);
          }
        } else {
          console.log('Event missing required fields:', currentEvent);
        }
      } else if (inEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const keyPart = line.substring(0, colonIndex);
        const key = keyPart.split(';')[0]; // Remove parameters like DTSTART;TZID=...
        const value = line.substring(colonIndex + 1);
        
        switch (key) {
          case 'SUMMARY':
            currentEvent.summary = value;
            console.log('Found summary:', value);
            break;
          case 'DTSTART':
            currentEvent.dtstart = value;
            console.log('Found start date:', value);
            break;
          case 'DTEND':
            currentEvent.dtend = value;
            console.log('Found end date:', value);
            break;
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value;
            break;
        }
      }
    }
    
    console.log('Final parsed events:', events);
    return events;
  };

  // Parse ICS date/time format
  const parseICSDateTime = (icsDateTime) => {
    try {
      // Handle different ICS date formats
      if (icsDateTime.length === 8) {
        // YYYYMMDD format (all-day event)
        const year = parseInt(icsDateTime.substr(0, 4));
        const month = parseInt(icsDateTime.substr(4, 2)) - 1;
        const day = parseInt(icsDateTime.substr(6, 2));
        return new Date(year, month, day);
      } else if (icsDateTime.includes('T')) {
        // YYYYMMDDTHHMMSSZ format
        const dateTimePart = icsDateTime.replace('Z', '').replace(/[-:]/g, '');
        const year = parseInt(dateTimePart.substr(0, 4));
        const month = parseInt(dateTimePart.substr(4, 2)) - 1;
        const day = parseInt(dateTimePart.substr(6, 2));
        const hour = parseInt(dateTimePart.substr(9, 2)) || 0;
        const minute = parseInt(dateTimePart.substr(11, 2)) || 0;
        const second = parseInt(dateTimePart.substr(13, 2)) || 0;
        
        return new Date(year, month, day, hour, minute, second);
      }
    } catch (error) {
      console.warn('Error parsing ICS date:', icsDateTime, error);
    }
    return null;
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
    const staff = employees.filter(emp => emp.role === 'staff' || emp.role === 'tech');

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

  const formatTimeShort = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    // If minutes are 00, don't show them
    if (minutes === '00') {
      return `${displayHour} ${ampm}`;
    } else {
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  const getStoreHours = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const storeHours = {
      0: '10 AM - 3 PM',    // Sunday
      1: '10 AM - 6 PM',    // Monday
      2: '10 AM - 6 PM',    // Tuesday
      3: '10 AM - 6 PM',    // Wednesday
      4: '10 AM - 6 PM',    // Thursday
      5: '10 AM - 5 PM',    // Friday
      6: '10 AM - 4 PM'     // Saturday
    };
    
    return storeHours[dayOfWeek] || '10 AM - 6 PM';
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

  const changeMonth = (direction) => {
    const currentDate = new Date(currentMonth + 'T00:00:00');
    currentDate.setMonth(currentDate.getMonth() + direction);
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    setCurrentMonth(formatDateForInput(firstOfMonth));
  };

  const getMonthDates = (monthStart) => {
    const dates = [];
    const startDate = new Date(monthStart + 'T00:00:00');
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // Get first day of month and find the Sunday before it (or same day if it's Sunday)
    const firstDayOfMonth = new Date(year, month, 1);
    const firstSunday = getSunday(firstDayOfMonth);
    
    // Get last day of month and find the Saturday after it (or same day if it's Saturday)
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const lastSaturday = new Date(lastDayOfMonth);
    while (lastSaturday.getDay() !== 6) {
      lastSaturday.setDate(lastSaturday.getDate() + 1);
    }
    
    // Generate all dates from first Sunday to last Saturday
    const current = new Date(firstSunday);
    while (current <= lastSaturday) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const formatMonthYear = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const printWeek = () => {
    const printWindow = window.open('', '_blank');
    const weekDates = getWeekDates(new Date(currentWeek + 'T00:00:00'));
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Weekly Schedule - ${formatDateHeader(weekDates[0])} to ${formatDateHeader(weekDates[6])}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .schedule-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; border: 1px solid #000; }
            .day-column { border: 1px solid #000; padding: 8px; min-height: 200px; }
            .day-header { font-weight: bold; background: #f0f0f0; padding: 5px; text-align: center; }
            .shift { margin: 2px 0; font-size: 12px; padding: 2px; background: #f9f9f9; }
            .conflict { background: #ffebee; }
            h1 { text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Weekly Schedule</h1>
          <h2>${formatDateHeader(weekDates[0])} - ${formatDateHeader(weekDates[6])}</h2>
          <div class="schedule-grid">
            ${weekDates.map(date => {
              const dateKey = formatDateForInput(date);
              const daySchedule = weeklySchedule[dateKey];
              return `
                <div class="day-column">
                  <div class="day-header">${formatDateHeader(date)}</div>
                  ${daySchedule ? daySchedule.shifts.map(shift => 
                    `<div class="shift ${shift.conflict ? 'conflict' : ''}">
                      ${shift.employee.display_name}<br>
                      ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}
                    </div>`
                  ).join('') : '<div>No schedule</div>'}
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const printMonth = () => {
    const printWindow = window.open('', '_blank');
    const monthDates = getMonthDates(currentMonth);
    const weeks = [];
    
    // Group dates into weeks
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Monthly Schedule - ${formatMonthYear(currentMonth)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; border: 1px solid #000; }
            .day-cell { border: 1px solid #000; padding: 4px; min-height: 80px; }
            .day-number { font-weight: bold; margin-bottom: 2px; }
            .other-month { color: #ccc; background: #f9f9f9; }
            .shift { font-size: 10px; margin: 2px 0; padding: 2px; background: #f0f8ff; border-radius: 2px; }
            .employee-name { font-weight: bold; }
            .shift-time { color: #666; font-size: 9px; }
            .day-header { font-weight: bold; background: #f0f0f0; padding: 5px; text-align: center; }
            h1 { text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Monthly Schedule - ${formatMonthYear(currentMonth)}</h1>
          <div class="month-grid">
            <div class="day-header">Sun</div>
            <div class="day-header">Mon</div>
            <div class="day-header">Tue</div>
            <div class="day-header">Wed</div>
            <div class="day-header">Thu</div>
            <div class="day-header">Fri</div>
            <div class="day-header">Sat</div>
            ${monthDates.map(date => {
              const dateKey = formatDateForInput(date);
              const currentMonthDate = new Date(currentMonth + 'T00:00:00');
              const isCurrentMonth = date.getMonth() === currentMonthDate.getMonth();
              const daySchedule = weeklySchedule[dateKey];
              
              return `
                <div class="day-cell ${!isCurrentMonth ? 'other-month' : ''}">
                  <div class="day-number">${date.getDate()}</div>
                  ${daySchedule ? daySchedule.shifts.map(shift => 
                    `<div class="shift">
                      <div class="employee-name">${shift.employee.display_name}</div>
                      <div class="shift-time">${formatTimeShort(shift.start_time)} - ${formatTimeShort(shift.end_time)}</div>
                    </div>`
                  ).join('') : ''}
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
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
      <h2>Schedule Manager</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Load your predefined base schedule and edit as needed. Time-off conflicts are highlighted in red.
        <strong> Set up your base schedule first using the "Base Schedule" tab.</strong>
      </p>

      {/* View Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        gap: '10px'
      }}>
        <button
          onClick={() => setViewMode('week')}
          style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'week' ? '#3b82f6' : '#e5e7eb',
            color: viewMode === 'week' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: viewMode === 'week' ? 'bold' : 'normal'
          }}
        >
          Week View
        </button>
        <button
          onClick={() => setViewMode('month')}
          style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'month' ? '#3b82f6' : '#e5e7eb',
            color: viewMode === 'month' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: viewMode === 'month' ? 'bold' : 'normal'
          }}
        >
          Month View
        </button>
      </div>

      {/* Navigation and Print Controls */}
      {viewMode === 'week' ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>
                Week of {formatDateHeader(getWeekDates(new Date(currentWeek + 'T00:00:00'))[0])} - {formatDateHeader(getWeekDates(new Date(currentWeek + 'T00:00:00'))[6])}
              </h3>
              <input
                type="date"
                value={currentWeek}
                onChange={(e) => {
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
              onClick={printWeek}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🖨️ Print Week
            </button>
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
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => changeMonth(-1)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Previous Month
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>
                {formatMonthYear(currentMonth)}
              </h3>
              <input
                type="month"
                value={currentMonth.substring(0, 7)}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  const firstOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                  setCurrentMonth(formatDateForInput(firstOfMonth));
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
              onClick={printMonth}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🖨️ Print Month
            </button>
          </div>
          
          <button
            onClick={() => changeMonth(1)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Next Month →
          </button>
        </div>
      )}

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

      {/* Schedule Display */}
      {viewMode === 'week' ? (
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
            {getWeekDates(new Date(currentWeek + 'T00:00:00')).map((date, index) => {
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
                      {getStoreHours(date)}
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

                    {/* Calendar Events Section */}
                    {calendarEvents[dateKey] && calendarEvents[dateKey].length > 0 && (
                      <div style={{
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '2px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#374151',
                          marginBottom: '8px',
                          textAlign: 'center'
                        }}>
                          📅 Store Events
                        </div>
                        {calendarEvents[dateKey].map((event, idx) => (
                          <div
                            key={`${event.id}-${idx}`}
                            style={{
                              fontSize: '11px',
                              padding: '6px 8px',
                              margin: '4px 0',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #f59e0b',
                              borderRadius: '4px',
                              color: '#92400e'
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                              {event.title}
                            </div>
                            {!event.isAllDay && event.startTime && event.endTime && (
                              <div style={{ fontSize: '10px', color: '#78716c' }}>
                                {formatTimeShort(new Date(event.startTime).toTimeString().substring(0, 5))} - {formatTimeShort(new Date(event.endTime).toTimeString().substring(0, 5))}
                              </div>
                            )}
                            {event.isAllDay && (
                              <div style={{ fontSize: '10px', color: '#78716c' }}>
                                All Day
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <MonthView 
          currentMonth={currentMonth}
          weeklySchedule={weeklySchedule}
          formatDateHeader={formatDateHeader}
          formatDateForInput={formatDateForInput}
          formatTimeShort={formatTimeShort}
          addShift={addShift}
        />
      )}

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

// MonthView Component
function MonthView({ 
  currentMonth, 
  weeklySchedule, 
  formatDateHeader, 
  formatDateForInput, 
  formatTimeShort,
  addShift 
}) {
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const monthDates = getMonthDates(new Date(currentMonth + 'T00:00:00'));
  const weeks = [];
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  return (
    <div style={{ 
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: 'white',
      width: '100%'
    }}>
      {/* Month Header */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #e5e7eb',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} style={{ padding: '8px' }}>{day}</div>
        ))}
      </div>
      
      {/* Month Grid */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: weekIndex < weeks.length - 1 ? '1px solid #e5e7eb' : 'none'
        }}>
          {week.map((date, dayIndex) => {
            const dateKey = formatDateForInput(date);
            const daySchedule = weeklySchedule[dateKey];
            const currentMonthDate = new Date(currentMonth + 'T00:00:00');
            const isCurrentMonth = date.getMonth() === currentMonthDate.getMonth();
            
            return (
              <div
                key={dateKey}
                style={{
                  border: dayIndex < 6 ? '0 1px 0 0' : '0',
                  borderStyle: 'solid',
                  borderColor: '#e5e7eb',
                  backgroundColor: isCurrentMonth ? 'white' : '#f9fafb',
                  opacity: isCurrentMonth ? 1 : 0.6
                }}
              >
                {/* Date Header */}
                <div style={{
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textAlign: 'center',
                  backgroundColor: isCurrentMonth ? '#f3f4f6' : '#e5e7eb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {date.getDate()}
                </div>

                {/* Day Schedule */}
                <div style={{ padding: '4px' }}>
                  {daySchedule && daySchedule.shifts.length > 0 ? (
                    <div>
                      {daySchedule.shifts.map((shift) => (
                        <div
                          key={shift.id}
                          style={{
                            fontSize: '10px',
                            padding: '2px 4px',
                            margin: '2px 0',
                            backgroundColor: '#dbeafe',
                            borderRadius: '3px',
                            lineHeight: '1.2'
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            {shift.employee.display_name}
                          </div>
                          <div style={{ color: '#6b7280' }}>
                            {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    isCurrentMonth && (
                      <button
                        onClick={() => addShift(dateKey)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '10px',
                          backgroundColor: '#f3f4f6',
                          border: '1px dashed #9ca3af',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                      >
                        + Add
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
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
    if (shift.employee.role === 'tech') return '#faf5ff'; // Purple for tech
    return '#f0fdf4'; // Green for staff
  };

  const getBorderColor = () => {
    if (shift.conflict) return '#fecaca';
    if (shift.partialTimeOff) return '#fed7aa';
    if (shift.employee.role === 'manager') return '#bae6fd';
    if (shift.employee.role === 'tech') return '#e9d5ff'; // Purple border for tech
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