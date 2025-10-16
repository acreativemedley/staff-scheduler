import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { parseDate, formatDateForInput, formatDateDisplay, getWeekDates, isDateInRange, isSameDay } from './dateUtils';
import { extractTimeOnly, normalizeTime } from './timeUtils';
import { useUser } from './UserContext-Minimal';
import { theme } from './theme';
import './ScheduleGenerator.css';

export default function ScheduleGenerator() {
  const { canEdit, userProfile } = useUser();
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
  const [editingShiftId, setEditingShiftId] = useState(null); // Track which shift is being edited

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
    console.log('ScheduleGenerator: Component mounted, initializing...');
    initializeData();
    
    // Listen for local time-off updates from TimeOffManager to refresh data
    const onTimeOffUpdated = () => {
      console.log('ScheduleGenerator: timeOffUpdated event received, refetching time-off requests');
      fetchTimeOffRequests();
    };
    window.addEventListener('timeOffUpdated', onTimeOffUpdated);
    
    // Refresh time-off data when tab/window becomes visible (user returns to schedule)
    const onVisibilityChange = () => {
      if (!document.hidden) {
        console.log('ScheduleGenerator: Tab became visible, refreshing time-off data');
        fetchTimeOffRequests();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('timeOffUpdated', onTimeOffUpdated);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (currentWeek && employees.length > 0) {
      console.log('ScheduleGenerator: Triggering generateBaseSchedule - currentWeek:', currentWeek, 'employees:', employees.length)
      generateBaseSchedule();
    } else {
      console.log('ScheduleGenerator: Not ready to generate - currentWeek:', currentWeek, 'employees:', employees.length)
    }
  }, [currentWeek, employees, timeOffRequests]);

  useEffect(() => {
    if (currentWeek) {
      const weekStart = parseDate(currentWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999); // End of day
      
      fetchGoogleCalendarEvents(weekStart, weekEnd);
    }
  }, [currentWeek]);

  // Fetch time-off requests (defined BEFORE initializeData so it's available)
  const fetchTimeOffRequests = async () => {
    const timestamp = Date.now();
    console.log('ScheduleGenerator: Fetching time-off requests... (timestamp:', timestamp, ')');
    
    // Fetch all time-off requests with cache-busting timestamp
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(1000); // Force new query with limit
    
    if (error) {
      console.error('ScheduleGenerator: Error fetching time off requests:', error);
    } else {
      console.log('✅ Fetched', data?.length || 0, 'time-off requests');
      // Check for Lisa Sheldon's Oct 11 and Oct 25 requests
      const lisaRequests = data.filter(r => 
        (r.start_date === '2025-10-11' || r.start_date === '2025-10-25') &&
        r.employee_id === '59ea0226-d0b0-4e8a-badd-ac1dd433b9ed'
      );
      console.log('🔍 Lisa Oct 11/25 in DB:', lisaRequests.length, 'requests');
      // Force new array reference to trigger re-render
      setTimeOffRequests([...data]);
    }
  };

  const initializeData = async () => {
    console.log('ScheduleGenerator: Starting initialization...')
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
      
      console.log('ScheduleGenerator: Initialization complete')
      setLoading(false);
    } catch (error) {
      console.error('ScheduleGenerator: Error during initialization:', error);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    console.log('ScheduleGenerator: Fetching employees...')
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
    
    console.log('ScheduleGenerator: Employees fetch result:', { data, error, count: data?.length })
    
    if (error) {
      console.error('ScheduleGenerator: Error fetching employees:', error);
    } else {
      console.log('ScheduleGenerator: Setting employees:', data?.length || 0, 'employees')
      setEmployees(data || []);
    }
  };

  const fetchScheduleTemplates = async () => {
    console.log('ScheduleGenerator: Fetching schedule templates...')
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week');
    
    console.log('ScheduleGenerator: Schedule templates fetch result:', { data, error, count: data?.length })
    
    if (error) {
      console.error('ScheduleGenerator: Error fetching templates:', error);
    } else {
      console.log('ScheduleGenerator: Setting templates:', data?.length || 0, 'templates')
      // Log each template's time values to check for timezone issues
      if (data && data.length > 0) {
        console.log('🕒 TEMPLATE TIME CHECK:');
        data.forEach(t => {
          console.log(`  Day ${t.day_of_week}: open=${t.store_open_time} (${typeof t.store_open_time}), close=${t.store_close_time} (${typeof t.store_close_time})`);
        });
      }
      setScheduleTemplates(data || []);
    }
  };

  /**
   * Fetch Google Calendar events via CORS proxy
   * 
   * TROUBLESHOOTING:
   * - If you see 408 timeout errors, the CORS proxy may be slow/down
   * - This function tries multiple proxies in fallback order
   * - See network-troubleshooting.md for full documentation
   * 
   * CORS PROXY CHAIN (tries in order):
   * 1. corsproxy.io - Fast and reliable
   * 2. api.allorigins.win - Good backup
   * 3. cors-anywhere.herokuapp.com - Last resort
   * 
   * TO ADD MORE PROXIES:
   * Add to the proxies array with format:
   * { name: 'proxy-name', url: 'proxy-url', direct: true/false }
   * - direct: true if proxy returns iCal directly
   * - direct: false if proxy wraps response in JSON with 'contents' field
   */
  const fetchGoogleCalendarEvents = async (startDate, endDate) => {
    try {
      const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`;
      
      // Try multiple CORS proxies in order
      const proxies = [
        { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(icalUrl)}`, direct: true },
        { name: 'api.allorigins.win', url: `https://api.allorigins.win/get?url=${encodeURIComponent(icalUrl)}`, direct: false },
        { name: 'cors-anywhere (backup)', url: `https://cors-anywhere.herokuapp.com/${icalUrl}`, direct: true }
      ];
      
      for (const proxy of proxies) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const proxyResponse = await fetch(proxy.url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!proxyResponse.ok) {
            throw new Error(`${proxy.name} request failed with status ${proxyResponse.status}`);
          }
          
          let icalData;
          
          if (proxy.direct) {
            // Direct response - text is the iCal data
            icalData = await proxyResponse.text();
          } else {
            // Wrapped response - need to extract contents
            const proxyData = await proxyResponse.json();
            
            if (!proxyData.contents) {
              throw new Error(`No contents in ${proxy.name} response`);
            }
            
            icalData = proxyData.contents;
          }
          
          // Check if the data is base64 encoded
          if (icalData.startsWith('data:text/calendar') && icalData.includes('base64,')) {
            const base64Data = icalData.split('base64,')[1];
            icalData = atob(base64Data);
          }
          
          const events = parseSimpleICS(icalData, startDate, endDate);
          setCalendarEvents(events);
          return; // Success! Exit function
          
        } catch (proxyError) {
          // Continue to next proxy
        }
      }
      
      // All proxies failed
      throw new Error('All CORS proxy methods failed');

    } catch (error) {
      console.error('❌ Calendar fetch failed:', error.message);
      // Set empty calendar events instead of mock data
      setCalendarEvents({});
      console.warn('⚠️ Unable to load Google Calendar events. Please check:\n' +
        '1. Calendar is set to public\n' +
        '2. Calendar ID is correct\n' +
        '3. Internet connection is working');
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
            console.log('Date range check - Event date:', eventDate, 'Start:', startDate, 'End:', endDate);
            
            if (eventDate) {
              // For date range comparison, we need to compare the calendar dates
              // rather than exact timestamps to handle timezone differences
              const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
              const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              
              console.log('Date-only comparison - Event:', eventDateOnly, 'Start:', startDateOnly, 'End:', endDateOnly);
              
              if (eventDateOnly >= startDateOnly && eventDateOnly <= endDateOnly) {
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
                console.log('Event outside date range:', eventDateOnly, 'not between', startDateOnly, 'and', endDateOnly);
              }
            } else {
              console.log('Failed to parse event date for:', currentEvent.summary);
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
        // YYYYMMDDTHHMMSSZ format (UTC time) or YYYYMMDDTHHMMSS (local time)
        if (icsDateTime.endsWith('Z')) {
          // UTC time - use Date constructor with ISO string format
          const isoString = icsDateTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
          return new Date(isoString);
        } else {
          // Local time or no timezone specified - treat as local time
          const dateTimePart = icsDateTime.replace(/[-:]/g, '');
          const year = parseInt(dateTimePart.substr(0, 4));
          const month = parseInt(dateTimePart.substr(4, 2)) - 1;
          const day = parseInt(dateTimePart.substr(6, 2));
          const hour = parseInt(dateTimePart.substr(9, 2)) || 0;
          const minute = parseInt(dateTimePart.substr(11, 2)) || 0;
          const second = parseInt(dateTimePart.substr(13, 2)) || 0;
          
          return new Date(year, month, day, hour, minute, second);
        }
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

  // Use centralized date utilities - these functions are now imported from dateUtils.js
  // Removed duplicate parseDate and formatDateForInput functions

  const isEmployeeOnTimeOff = (employeeId, date) => {
    // Handle both Date objects and date strings
    const dateStr = date instanceof Date ? formatDateForInput(date) : date;
    
    // Special logging for Lisa on Oct 11 and Oct 25
    const isLisa = employeeId === '59ea0226-d0b0-4e8a-badd-ac1dd433b9ed';
    const isTargetDate = dateStr === '2025-10-11' || dateStr === '2025-10-25';
    
    if (isLisa && isTargetDate) {
      console.log(`\n🚨 LISA SHELDON CHECK: Date ${dateStr}`);
      console.log(`   Total timeOffRequests in state:`, timeOffRequests.length);
      const lisaRequests = timeOffRequests.filter(r => r.employee_id === employeeId);
      console.log(`   Lisa's time-off requests:`, lisaRequests.length);
      console.log(`   Lisa's request details:`, lisaRequests.map(r => ({
        id: r.id,
        start: r.start_date,
        end: r.end_date,
        type: r.request_type
      })));
    }
    
    const result = timeOffRequests.some(request => {
      if (request.employee_id !== employeeId) return false;
      
      const startDate = parseDate(request.start_date);
      const endDate = parseDate(request.end_date);
      const checkDate = parseDate(dateStr);
      
      if (request.request_type === 'full_days') {
        return isDateInRange(checkDate, startDate, endDate);
      } else if (request.request_type === 'partial_day') {
        return isSameDay(checkDate, startDate);
      }
      
      return false;
    });
    
    return result;
  };

  // Check if employee has FULL DAY time off (not partial)
  const isEmployeeOnFullDayTimeOff = (employeeId, date) => {
    const dateStr = date instanceof Date ? formatDateForInput(date) : date;
    
    return timeOffRequests.some(request => {
      if (request.employee_id !== employeeId) return false;
      if (request.request_type !== 'full_days') return false;
      
      const startDate = parseDate(request.start_date);
      const endDate = parseDate(request.end_date);
      const checkDate = parseDate(dateStr);
      
      return isDateInRange(checkDate, startDate, endDate);
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
      
      return isSameDay(checkDate, requestDate);
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
      console.log('No existing schedule found, generating from base schedule for week:', currentWeek)
      const { data: baseScheduleData, error: baseError } = await supabase
        .rpc('get_base_schedule_for_week', {
          p_week_start_date: currentWeek
        });
        
      console.log('Base schedule RPC result:', { baseScheduleData, baseError, count: baseScheduleData?.length })
        
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
        console.log('No base schedule found - this means your base_schedule table is empty');
        console.log('You need to set up your base schedule using the Base Schedule Manager tab');
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

    // Add shifts from weekly schedule data
    let addedShifts = 0;
    weeklyScheduleData.forEach(entry => {
      const dateKey = entry.schedule_date;
      
      if (schedule[dateKey]) {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        
        if (employee) {
          const hasFullDayTimeOff = isEmployeeOnFullDayTimeOff(employee.id, dateKey);
          const partialTimeOff = getPartialTimeOff(employee.id, dateKey);
          
          schedule[dateKey].shifts.push({
            id: entry.id || `${employee.id}-${dateKey}`,
            employee: employee,
            start_time: entry.start_time,
            end_time: entry.end_time,
            position: entry.job_position || entry.position || entry.employee_position,
            conflict: hasFullDayTimeOff,
            partialTimeOff: partialTimeOff,
            notes: entry.notes || '',
            isFromBase: entry.is_from_base,
            weeklyScheduleId: entry.id
          });
          addedShifts++;
        }
      }
    });

    console.log(`✅ Built schedule with ${addedShifts} shifts`);
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
          const hasFullDayTimeOff = isEmployeeOnFullDayTimeOff(employee.id, dateKey);
          const partialTimeOff = getPartialTimeOff(employee.id, dateKey);
          
          schedule[dateKey].shifts.push({
            id: `${employee.id}-${dateKey}`,
            employee: employee,
            start_time: entry.start_time,
            end_time: entry.end_time,
            position: entry.employee_position,
            conflict: hasFullDayTimeOff,
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

    // Normalize template times to handle timezone issues
    const openTime = normalizeTime(template.store_open_time, '09:00');
    const closeTime = normalizeTime(template.store_close_time, '17:00');

    // Add managers
    for (let i = 0; i < template.required_managers && i < managers.length; i++) {
      const employee = managers[i];
      const hasFullDayTimeOff = isEmployeeOnFullDayTimeOff(employee.id, date);
      const partialTimeOff = getPartialTimeOff(employee.id, date);
      
      shifts.push({
        id: `${employee.id}-${formatDateForInput(date)}`,
        employee: employee,
        start_time: openTime,
        end_time: closeTime,
        position: employee.position,
        conflict: hasFullDayTimeOff,
        partialTimeOff: partialTimeOff
      });
    }

    // Add staff
    for (let i = 0; i < template.required_staff && i < staff.length; i++) {
      const employee = staff[i];
      const hasFullDayTimeOff = isEmployeeOnFullDayTimeOff(employee.id, date);
      const partialTimeOff = getPartialTimeOff(employee.id, date);
      
      shifts.push({
        id: `${employee.id}-${formatDateForInput(date)}`,
        employee: employee,
        start_time: openTime,
        end_time: closeTime,
        position: employee.position,
        conflict: hasFullDayTimeOff,
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
        color: theme.dangerBg,
        borderColor: theme.dangerBorder,
        textColor: theme.dangerText,
        explanation: timeOffRequest?.reason || 'Full day time off'
      };
    }
    
    if (partialTimeOff) {
      const startTime = partialTimeOff.partial_start_time;
      const endTime = partialTimeOff.partial_end_time;
      return {
        status: 'partial',
        color: theme.warningBg,
        borderColor: theme.warningBorder,
        textColor: theme.warningText,
        explanation: `Partial time off: ${startTime}-${endTime}${partialTimeOff.reason ? ` (${partialTimeOff.reason})` : ''}`
      };
    }
    
    return {
      status: 'available',
      color: theme.successBg,
      borderColor: theme.successBorder,
      textColor: theme.successText,
      explanation: 'Available'
    };
  };

  const handleEmployeeSelection = (selectedEmployee) => {
    const daySchedule = weeklySchedule[modalDateKey];
    if (!daySchedule || !selectedEmployee) return;

    // Get template for this day of week, or use default times
    console.log('🕒 Adding employee - Day of week:', daySchedule.dayOfWeek);
    console.log('🕒 Available templates:', scheduleTemplates);
    console.log('🕒 Looking for template with day_of_week:', daySchedule.dayOfWeek);
    
    const template = scheduleTemplates.find(t => t.day_of_week === daySchedule.dayOfWeek);
    console.log('🕒 Template found:', template);
    console.log('🕒 Raw store_open_time:', template?.store_open_time, 'Type:', typeof template?.store_open_time);
    console.log('🕒 Raw store_close_time:', template?.store_close_time, 'Type:', typeof template?.store_close_time);
    
    // Use normalizeTime to handle any timezone issues with TIME values from PostgreSQL
    const defaultStartTime = normalizeTime(template?.store_open_time, '09:00');
    const defaultEndTime = normalizeTime(template?.store_close_time, '17:00');
    
    console.log('🕒 Normalized start time:', defaultStartTime);
    console.log('🕒 Normalized end time:', defaultEndTime);

    const newShift = {
      id: `${selectedEmployee.id}-${modalDateKey}`,
      employee: selectedEmployee,
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      position: selectedEmployee.position,
      conflict: isEmployeeOnFullDayTimeOff(selectedEmployee.id, daySchedule.date),
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
    const weekDates = getWeekDates(parseDate(currentWeek));
    
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
            .events-section { margin-top: 10px; padding-top: 8px; border-top: 2px solid #e5e7eb; }
            .events-header { font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 4px; text-align: center; }
            .event { margin: 1px 0; font-size: 10px; padding: 3px 4px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 3px; color: #92400e; }
            .event-title { font-weight: bold; }
            .event-time { font-size: 9px; color: #78716c; }
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
              const dayEvents = calendarEvents[dateKey];
              return `
                <div class="day-column">
                  <div class="day-header">${formatDateHeader(date)}</div>
                  ${daySchedule ? daySchedule.shifts.map(shift => 
                    `<div class="shift ${shift.conflict ? 'conflict' : ''}">
                      ${shift.employee.display_name}<br>
                      ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}
                    </div>`
                  ).join('') : '<div>No schedule</div>'}
                  ${dayEvents && dayEvents.length > 0 ? `
                    <div class="events-section">
                      <div class="events-header">📅 Store Events</div>
                      ${dayEvents.map(event => `
                        <div class="event">
                          <div class="event-title">${event.title}</div>
                          ${!event.isAllDay && event.startTime && event.endTime ? `
                            <div class="event-time">${new Date(event.startTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})} - ${new Date(event.endTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})}</div>
                          ` : event.isAllDay ? `
                            <div class="event-time">All Day</div>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
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

  const printMonth = async () => {
    console.log('🖨️ PrintMonth: Function called - starting');
    
    try {
      console.log('🖨️ PrintMonth: Inside try block');
      // Load monthly schedule data first
      const monthDates = getMonthDates(currentMonth);
      console.log('🖨️ PrintMonth: Month dates:', monthDates.length, 'dates');
      
      const startDate = monthDates[0];
      const endDate = monthDates[monthDates.length - 1];
      
      console.log('🖨️ PrintMonth: Loading schedule data from', formatDateForInput(startDate), 'to', formatDateForInput(endDate));
      
      // Get all schedule data for the month
      const { data: scheduleData, error } = await supabase
        .from('weekly_schedules')
        .select('*')
        .gte('schedule_date', formatDateForInput(startDate))
        .lte('schedule_date', formatDateForInput(endDate))
        .order('schedule_date');
      
      if (error) {
        console.error('🖨️ PrintMonth: Database error:', error);
        alert('Error loading schedule data for printing: ' + error.message);
        return;
      }
      
      console.log('🖨️ PrintMonth: Loaded', scheduleData?.length, 'schedule entries');
      
      if (!scheduleData || scheduleData.length === 0) {
        console.warn('🖨️ PrintMonth: No schedule data found for this month');
        alert('No schedule data found for this month. Make sure you have saved some schedules first.');
        return;
      }
      
      // Build monthly schedule data structure
      const monthlyScheduleData = {};
      scheduleData.forEach(entry => {
        console.log('🖨️ PrintMonth: Processing entry for', entry.schedule_date, '- Employee:', entry.employee_id);
        const dateKey = entry.schedule_date;
        if (!monthlyScheduleData[dateKey]) {
          monthlyScheduleData[dateKey] = { shifts: [] };
        }
        
        // Each database entry IS a shift, not a container of shifts
        const shift = {
          id: `${entry.employee_id}-${entry.schedule_date}`,
          employee: {
            id: entry.employee_id,
            display_name: employees.find(emp => emp.id === entry.employee_id)?.display_name || 
                         employees.find(emp => emp.id === entry.employee_id)?.full_name || 
                         'Unknown Employee'
          },
          start_time: entry.start_time,
          end_time: entry.end_time,
          position: entry.position,
          notes: entry.notes || '',
          isFromBase: entry.is_from_base
        };
        
        monthlyScheduleData[dateKey].shifts.push(shift);
        console.log('🖨️ PrintMonth: Added shift for', shift.employee.display_name, 'on', dateKey);
      });
      
      console.log('🖨️ PrintMonth: Built schedule data for', Object.keys(monthlyScheduleData).length, 'days');
      console.log('🖨️ PrintMonth: Days with shifts:', Object.entries(monthlyScheduleData).filter(([key, data]) => data.shifts.length > 0).map(([key]) => key));
      
      // Create print window and generate content
      console.log('🖨️ PrintMonth: Creating print window');
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Unable to open print window. Please allow popups for this site.');
        return;
      }
      
      const weeks = [];
      
      // Group dates into weeks
      for (let i = 0; i < monthDates.length; i += 7) {
        weeks.push(monthDates.slice(i, i + 7));
      }
      
      console.log('🖨️ PrintMonth: Writing HTML content');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Monthly Schedule - ${formatMonthYear(currentMonth)}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 10px; 
                font-size: 12px;
              }
              h1 { 
                text-align: center; 
                margin: 5px 0 10px 0; 
                font-size: 18px;
                font-weight: bold;
              }
              .generated-info { 
                text-align: center; 
                font-size: 9px; 
                color: #666; 
                margin: 0 0 10px 0;
              }
              .month-grid { 
                display: grid; 
                grid-template-columns: repeat(7, 1fr); 
                gap: 1px; 
                border: 1px solid #000; 
                width: 100%;
              }
              .day-cell { 
                border: 1px solid #000; 
                padding: 2px; 
                min-height: 70px; 
                font-size: 10px;
              }
              .day-number { 
                font-weight: bold; 
                margin-bottom: 1px; 
                font-size: 11px;
              }
              .other-month { 
                color: #999; 
                background: #f5f5f5; 
              }
              .shift { 
                font-size: 10px; 
                margin: 1px 0; 
                padding: 1px 2px; 
                background: #e6f3ff; 
                border-radius: 2px; 
                line-height: 1.2;
              }
              .employee-name { 
                font-weight: bold; 
                font-size: 10px;
              }
              .shift-time { 
                color: #555; 
                font-size: 9px;
              }
              .day-header { 
                font-weight: bold; 
                background: #ddd; 
                padding: 3px; 
                text-align: center; 
                font-size: 10px;
                border-bottom: 1px solid #000;
              }
              .summary { 
                text-align: center; 
                margin-top: 10px; 
                font-size: 9px; 
                color: #666;
              }
              @media print { 
                body { margin: 0; font-size: 11px; } 
                .month-grid { 
                  page-break-inside: avoid; 
                  width: 98%; 
                  margin: 0 auto;
                }
                h1 { font-size: 16px; margin: 0 0 5px 0; }
                .generated-info { font-size: 8px; margin: 0 0 5px 0; }
                .day-cell { min-height: 65px; }
                .shift { font-size: 9px; }
                .employee-name { font-size: 9px; }
                .shift-time { font-size: 8px; }
                @page { 
                  margin: 0.4in; 
                  size: letter portrait;
                }
              }
            </style>
          </head>
          <body>
            <h1>${formatMonthYear(currentMonth)}</h1>
            <div class="generated-info">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
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
                const currentMonthDate = parseDate(currentMonth);
                const isCurrentMonth = date.getMonth() === currentMonthDate.getMonth();
                const daySchedule = monthlyScheduleData[dateKey];
                
                return `
                  <div class="day-cell ${!isCurrentMonth ? 'other-month' : ''}">
                    <div class="day-number">${date.getDate()}</div>
                    ${daySchedule && daySchedule.shifts && daySchedule.shifts.length > 0 ? daySchedule.shifts.map(shift => 
                      `<div class="shift">
                        <div class="employee-name">${shift.employee?.display_name || shift.employee?.name || 'Unknown'}</div>
                        <div class="shift-time">${formatTimeShort(shift.start_time)}-${formatTimeShort(shift.end_time)}</div>
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
      printWindow.focus();
      
      console.log('🖨️ PrintMonth: Content written, focusing window');
      
      // Wait a moment for content to load, then print
      setTimeout(() => {
        console.log('🖨️ PrintMonth: Triggering print dialog');
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error('🖨️ PrintMonth: Error:', error);
      alert('Error generating printable schedule: ' + error.message);
    }
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
      <h2 style={{ color: theme.textPrimary }}>Schedule Manager</h2>
      <p style={{ marginBottom: '20px', color: theme.textSecondary }}>
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
            backgroundColor: viewMode === 'week' ? theme.primary : theme.bgSecondary,
            color: viewMode === 'week' ? theme.primaryText : theme.textPrimary,
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
            backgroundColor: viewMode === 'month' ? theme.primary : theme.bgSecondary,
            color: viewMode === 'month' ? theme.primaryText : theme.textPrimary,
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
        <div className="schedule-nav-controls" style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: theme.cardBg,
          borderRadius: '8px'
        }}>
          <button
            onClick={() => changeWeek(-1)}
            style={{
              padding: '8px 16px',
              backgroundColor: theme.bgTertiary,
              color: theme.textPrimary,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Previous Week
          </button>
          
          <div className="schedule-nav-center">
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0', color: theme.textPrimary }}>
                Week of {formatDateHeader(getWeekDates(new Date(currentWeek + 'T00:00:00'))[0])} - {formatDateHeader(getWeekDates(new Date(currentWeek + 'T00:00:00'))[6])}
              </h3>
              <input
                type="date"
                value={currentWeek}
                onChange={(e) => {
                  const selectedDate = parseDate(e.target.value);
                  const sunday = getSunday(selectedDate);
                  setCurrentWeek(formatDateForInput(sunday));
                }}
                style={{
                  padding: '6px',
                  fontSize: '14px',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '4px',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary
                }}
              />
            </div>
            
            <button
              onClick={printWeek}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.success,
                color: theme.primaryText,
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
              backgroundColor: theme.bgTertiary,
              color: theme.textPrimary,
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
          backgroundColor: theme.cardBg,
          borderRadius: '8px'
        }}>
          <button
            onClick={() => changeMonth(-1)}
            style={{
              padding: '8px 16px',
              backgroundColor: theme.bgTertiary,
              color: theme.textPrimary,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Previous Month
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0', color: theme.textPrimary }}>
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
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '4px',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary
                }}
              />
            </div>
            
            <button
              onClick={printMonth}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.success,
                color: theme.primaryText,
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
              backgroundColor: theme.bgTertiary,
              color: theme.textPrimary,
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
      {canEdit() && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px' 
        }}>
          <button
            onClick={saveWeeklySchedule}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? theme.bgTertiary : theme.success,
              color: theme.primaryText,
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
      )}

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? theme.cardBg : theme.bgPrimary,
          color: message.includes('Error') ? theme.danger : theme.success,
          border: `1px solid ${message.includes('Error') ? theme.borderLight : theme.border}`,
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      {/* Schedule Display */}
      {viewMode === 'week' ? (
        <div style={{ 
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          backgroundColor: theme.bgPrimary,
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }} className="schedule-container">
          <div className="schedule-week-grid">
            {getWeekDates(new Date(currentWeek + 'T00:00:00')).map((date, index) => {
              const dateKey = formatDateForInput(date);
              const daySchedule = weeklySchedule[dateKey];
              
              return (
                <div
                  key={dateKey}
                  className="schedule-day-column"
                >
                  {/* Day Header */}
                  <div className="schedule-day-header" style={{
                    padding: '12px 8px',
                    backgroundColor: theme.bgSecondary,
                    borderBottom: `1px solid ${theme.border}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: theme.textPrimary }}>
                      {formatDateHeader(date)}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>
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
                            canEdit={canEdit()}
                            currentUserEmployeeId={userProfile?.employee_id}
                            isEditing={editingShiftId === shift.id}
                            onStartEdit={() => setEditingShiftId(shift.id)}
                            onCancelEdit={() => setEditingShiftId(null)}
                          />
                        ))}
                        
                        {canEdit() && (
                          <button
                            onClick={() => addShift(dateKey)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              marginTop: '10px',
                              backgroundColor: theme.bgSecondary,
                              border: `1px dashed ${theme.border}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: theme.textSecondary
                            }}
                          >
                            + Add Employee
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: theme.textSecondary, 
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
                        borderTop: `2px solid ${theme.border}`
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: theme.textPrimary,
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
                              backgroundColor: theme.bgSecondary,
                              border: `1px solid ${theme.borderLight}`,
                              borderRadius: '4px',
                              color: theme.textPrimary
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                              {event.title}
                            </div>
                            {!event.isAllDay && event.startTime && event.endTime && (
                              <div style={{ fontSize: '10px', color: theme.textSecondary }}>
                                {formatTimeShort(new Date(event.startTime).toTimeString().substring(0, 5))} - {formatTimeShort(new Date(event.endTime).toTimeString().substring(0, 5))}
                              </div>
                            )}
                            {event.isAllDay && (
                              <div style={{ fontSize: '10px', color: theme.textSecondary }}>
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
        <>
          {console.log('MonthView: Rendering month view with currentMonth:', currentMonth)}
          <MonthView 
            currentMonth={currentMonth}
            formatDateHeader={formatDateHeader}
            formatDateForInput={formatDateForInput}
            formatTimeShort={formatTimeShort}
            addShift={addShift}
            employees={employees}
            timeOffRequests={timeOffRequests}
          />
        </>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: theme.cardBg,
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: theme.textPrimary }}>Legend:</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: theme.textPrimary }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: theme.danger, border: `1px solid ${theme.borderLight}`, borderRadius: '3px' }} />
            <span>Time-off Conflict (Full Day)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: theme.warning, border: `1px solid ${theme.borderLight}`, borderRadius: '3px' }} />
            <span>Partial Day Time-off</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: theme.primary, border: `1px solid ${theme.borderLight}`, borderRadius: '3px' }} />
            <span>Manager</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: theme.success, border: `1px solid ${theme.borderLight}`, borderRadius: '3px' }} />
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
            backgroundColor: theme.cardBg,
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: theme.textPrimary }}>
              Add Employee to {modalDateKey ? formatDateHeader(new Date(modalDateKey + 'T00:00:00')) : 'Day'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px 0', color: theme.textSecondary, fontSize: '14px' }}>
                Select an employee to add to the schedule:
              </p>
              
              {/* Availability Legend */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '8px 12px', 
                backgroundColor: theme.bgSecondary, 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: theme.textPrimary }}>
                  Availability Status:
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: theme.success, 
                      border: `1px solid ${theme.borderLight}`, 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: theme.success }}>Available</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: theme.warning, 
                      border: `1px solid ${theme.borderLight}`, 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: theme.warning }}>Partial Time Off</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: theme.danger, 
                      border: `1px solid ${theme.borderLight}`, 
                      borderRadius: '2px' 
                    }} />
                    <span style={{ color: theme.danger }}>Unavailable</span>
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
                        <div style={{ fontWeight: 'bold', color: theme.textPrimary }}>
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
                      <div style={{ color: theme.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
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
                  backgroundColor: theme.bgPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: theme.textPrimary
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
  formatDateHeader, 
  formatDateForInput, 
  formatTimeShort,
  addShift,
  employees,
  timeOffRequests
}) {
  const [monthlySchedule, setMonthlySchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlySchedule();
  }, [currentMonth]);

  const loadMonthlySchedule = async () => {
    if (!currentMonth) return;
    
    setLoading(true);
    console.log('MonthView: Loading schedule data for month:', currentMonth);
    
    try {
      // Get the full date range for the month calendar (including partial weeks)
      const monthDates = getMonthDates(new Date(currentMonth + 'T00:00:00'));
      const startDate = monthDates[0];
      const endDate = monthDates[monthDates.length - 1];
      
      console.log('MonthView: Date range:', formatDateForInput(startDate), 'to', formatDateForInput(endDate));
      
      // Load all weekly schedules that overlap with this month view
      const { data: scheduleData, error } = await supabase
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
          employees!inner(id, full_name, display_name, position, role)
        `)
        .gte('schedule_date', formatDateForInput(startDate))
        .lte('schedule_date', formatDateForInput(endDate))
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });

      console.log('MonthView: Query result:', { scheduleData, error, count: scheduleData?.length });

      if (error) {
        console.error('MonthView: Error loading schedule data:', error);
        setMonthlySchedule({});
      } else {
        console.log('MonthView: Raw schedule data:', scheduleData);
        if (scheduleData && scheduleData.length > 0) {
          console.log('MonthView: First few entries:', scheduleData.slice(0, 3));
          console.log('MonthView: Date range of data:', scheduleData[0]?.schedule_date, 'to', scheduleData[scheduleData.length - 1]?.schedule_date);
        }
        buildMonthlyScheduleData(scheduleData || []);
      }
      
      // Also check what weeks have been saved in weekly_schedules
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_schedules')
        .select('week_start_date, schedule_date')
        .gte('schedule_date', formatDateForInput(startDate))
        .lte('schedule_date', formatDateForInput(endDate));
      
      console.log('MonthView: Weeks with saved data:', weeklyData?.map(d => d.week_start_date).filter((v, i, a) => a.indexOf(v) === i));
    } catch (err) {
      console.error('MonthView: Error:', err);
      setMonthlySchedule({});
    } finally {
      setLoading(false);
    }
  };

  const buildMonthlyScheduleData = (scheduleData) => {
    const monthlyData = {};
    
    scheduleData.forEach(entry => {
      const dateKey = entry.schedule_date;
      
      if (!monthlyData[dateKey]) {
        monthlyData[dateKey] = {
          shifts: [],
          events: []
        };
      }
      
      monthlyData[dateKey].shifts.push({
        id: entry.id,
        employee: {
          id: entry.employees.id,
          full_name: entry.employees.full_name,
          display_name: entry.employees.display_name || entry.employees.full_name,
          position: entry.employees.position,
          role: entry.employees.role
        },
        start_time: entry.start_time,
        end_time: entry.end_time,
        position: entry.position,
        notes: entry.notes,
        is_from_base: entry.is_from_base,
        // Add time off conflict checking
        conflict: checkTimeOffConflict(entry.employee_id, dateKey, entry.start_time, entry.end_time),
        partialTimeOff: checkPartialTimeOffConflict(entry.employee_id, dateKey, entry.start_time, entry.end_time)
      });
    });
    
    console.log('MonthView: Built monthly schedule data:', monthlyData);
    setMonthlySchedule(monthlyData);
  };

  const checkTimeOffConflict = (employeeId, date, startTime, endTime) => {
    return timeOffRequests.some(request => 
      request.employee_id === employeeId &&
      request.status === 'approved' &&
      request.start_date <= date &&
      request.end_date >= date
    );
  };

  const checkPartialTimeOffConflict = (employeeId, date, startTime, endTime) => {
    // This could be expanded to check for partial day conflicts
    return false;
  };

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

  if (loading) {
    return (
      <div style={{ 
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        backgroundColor: theme.cardBg,
        width: '100%',
        padding: '2rem',
        textAlign: 'center',
        color: theme.textPrimary
      }}>
        Loading monthly schedule...
      </div>
    );
  }

  return (
    <div style={{ 
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      backgroundColor: theme.cardBg,
      width: '100%'
    }}>
      {/* Month Header */}
      <div style={{
        padding: '12px',
        backgroundColor: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontWeight: 'bold',
        color: theme.textPrimary
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
          borderBottom: weekIndex < weeks.length - 1 ? `1px solid ${theme.border}` : 'none'
        }}>
          {week.map((date, dayIndex) => {
            const dateKey = formatDateForInput(date);
            const daySchedule = monthlySchedule[dateKey];
            const currentMonthDate = new Date(currentMonth + 'T00:00:00');
            const isCurrentMonth = date.getMonth() === currentMonthDate.getMonth();
            
            return (
              <div
                key={dateKey}
                style={{
                  border: dayIndex < 6 ? '0 1px 0 0' : '0',
                  borderStyle: 'solid',
                  borderColor: theme.border,
                  backgroundColor: isCurrentMonth ? theme.bgPrimary : theme.bgSecondary,
                  opacity: isCurrentMonth ? 1 : 0.8,
                  color: theme.textPrimary
                }}
              >
                {/* Date Header */}
                <div style={{
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textAlign: 'center',
                  backgroundColor: isCurrentMonth ? theme.bgSecondary : theme.cardBg,
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.textPrimary
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
                            backgroundColor: theme.bgSecondary,
                            borderRadius: '3px',
                            lineHeight: '1.2',
                            color: theme.textPrimary
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            {shift.employee.display_name}
                          </div>
                          <div style={{ color: theme.textSecondary }}>
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
                          backgroundColor: theme.bgSecondary,
                          border: `1px dashed ${theme.border}`,
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: theme.textSecondary
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

function ShiftCard({ shift, dateKey, onUpdate, onRemove, formatTime, employees, canEdit, currentUserEmployeeId, isEditing, onStartEdit, onCancelEdit }) {
  const [tempValues, setTempValues] = useState({
    employee_id: shift.employee.id,
    start_time: shift.start_time,
    end_time: shift.end_time
  });

  // Reset temp values when editing is cancelled or when shift data changes
  useEffect(() => {
    if (!isEditing) {
      setTempValues({
        employee_id: shift.employee.id,
        start_time: shift.start_time,
        end_time: shift.end_time
      });
    }
  }, [isEditing, shift.employee.id, shift.start_time, shift.end_time]);

  const isCurrentUser = currentUserEmployeeId && shift.employee.id === currentUserEmployeeId;

  const getShiftBackgroundColor = () => {
    // Use theme semantic colors for consistency
    if (shift.conflict) return theme.cardBg; // conflict will be indicated by border/text
    if (shift.partialTimeOff) return theme.bgSecondary;
    if (shift.employee.role === 'manager') return theme.bgTertiary;
    if (shift.employee.role === 'tech') return theme.bgTertiary;
    return theme.bgPrimary;
  };

  const getBorderColor = () => {
    // If this is the current user's shift, use a bold primary color
    if (isCurrentUser) return theme.primary;

    if (shift.conflict) return theme.danger;
    if (shift.partialTimeOff) return theme.warning;
    if (shift.employee.role === 'manager') return theme.primary;
    if (shift.employee.role === 'tech') return theme.bgTertiary;
    return theme.success;
  };
  
  const getBorderWidth = () => {
    // Current user's shifts get a thicker border
    return isCurrentUser ? '6px' : '1px';
  };

  const handleSave = () => {
    // Only update times, not employee
    onUpdate(dateKey, shift.id, 'start_time', tempValues.start_time);
    onUpdate(dateKey, shift.id, 'end_time', tempValues.end_time);
    onCancelEdit();
  };

  const handleCancel = () => {
    setTempValues({
      employee_id: shift.employee.id,
      start_time: shift.start_time,
      end_time: shift.end_time
    });
    onCancelEdit();
  };

  return (
    <div
      style={{
        backgroundColor: getShiftBackgroundColor(),
        border: `${getBorderWidth()} solid ${getBorderColor()}`,
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '8px',
        fontSize: '12px',
        position: 'relative',
        zIndex: isEditing ? 10 : 1
      }}
    >
      {isEditing ? (
        <div>
          {/* Display employee name (non-editable) */}
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            color: theme.textPrimary,
            fontSize: '13px'
          }}>
            {shift.employee.display_name || shift.employee.full_name}
          </div>
          <div style={{ 
            color: theme.textSecondary, 
            marginBottom: '8px',
            fontSize: '11px'
          }}>
            {shift.employee.position}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}>
            <input
              type="time"
              value={tempValues.start_time}
              onChange={(e) => setTempValues(prev => ({ ...prev, start_time: e.target.value }))}
              style={{
                padding: '4px',
                fontSize: '12px',
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: theme.inputBg,
                color: theme.textPrimary
              }}
            />
            <input
              type="time"
              value={tempValues.end_time}
              onChange={(e) => setTempValues(prev => ({ ...prev, end_time: e.target.value }))}
              style={{
                padding: '4px',
                fontSize: '12px',
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: theme.inputBg,
                color: theme.textPrimary
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '4px 8px',
                backgroundColor: theme.success,
                color: theme.primaryText,
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
                backgroundColor: theme.bgTertiary,
                color: theme.textPrimary,
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
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: theme.textPrimary }}>
            {shift.employee.display_name || shift.employee.full_name}
          </div>
          <div style={{ color: theme.textSecondary, marginBottom: '4px' }}>
            {shift.employee.position}
          </div>
          <div style={{ marginBottom: '8px', color: theme.textPrimary }}>
            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
          </div>
          
          {shift.conflict && (
            <div style={{ color: theme.danger, fontSize: '11px', marginBottom: '4px' }}>
              ⚠️ Full Day Time-off
            </div>
          )}
          
          {shift.partialTimeOff && (
            <div style={{ color: theme.warning, fontSize: '11px', marginBottom: '4px' }}>
              ⚠️ Available: {formatTime(shift.partialTimeOff.partial_start_time)} - {formatTime(shift.partialTimeOff.partial_end_time)}
            </div>
          )}
          
          {canEdit && (
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={onStartEdit}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
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
                  backgroundColor: theme.danger,
                  color: theme.primaryText,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
