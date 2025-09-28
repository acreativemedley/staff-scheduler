import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function AvailabilityOverview() {
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  const daysOfWeek = [
    { id: 0, name: 'Sun', fullName: 'Sunday' },
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' }
  ];

  const statusColors = {
    green: '#4ade80',
    yellow: '#fbbf24',
    red: '#f87171'
  };

  useEffect(() => {
    fetchAvailabilityOverview();
  }, []);

  const fetchAvailabilityOverview = async () => {
    setLoading(true);
    try {
      console.log('AvailabilityOverview: Starting to fetch data...');
      
      // Fetch employees
      console.log('AvailabilityOverview: Fetching employees...');
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, display_name, position')
        .order('full_name');

      console.log('AvailabilityOverview: Employees result:', { employeesData, employeesError });
      if (employeesError) throw employeesError;

      // Fetch all availability data
      console.log('AvailabilityOverview: Fetching availability data...');
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('employee_availability')
        .select('*')
        .order('day_of_week');

      console.log('AvailabilityOverview: Availability result:', { availabilityData, availabilityError });
      if (availabilityError) throw availabilityError;

      // Organize availability by employee
      const availabilityByEmployee = {};
      availabilityData.forEach(item => {
        if (!availabilityByEmployee[item.employee_id]) {
          availabilityByEmployee[item.employee_id] = {};
        }
        availabilityByEmployee[item.employee_id][item.day_of_week] = item;
      });

      setEmployees(employeesData || []);
      setAvailability(availabilityByEmployee);
      console.log('AvailabilityOverview: Data successfully loaded');
    } catch (error) {
      console.error('AvailabilityOverview: Error fetching availability overview:', error);
    }
    console.log('AvailabilityOverview: Setting loading to false');
    setLoading(false);
  };

  const getAvailabilityCell = (employee, day) => {
    const employeeAvailability = availability[employee.id];
    const dayAvailability = employeeAvailability ? employeeAvailability[day.id] : null;

    if (!dayAvailability) {
      return (
        <div style={{
          backgroundColor: '#e5e7eb',
          padding: '8px',
          textAlign: 'center',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Not Set
        </div>
      );
    }

    const backgroundColor = statusColors[dayAvailability.status] || '#e5e7eb';
    const textColor = dayAvailability.status === 'yellow' ? '#000' : '#fff';
    
    let timeText = '';
    if (dayAvailability.earliest_start_time || dayAvailability.latest_end_time) {
      const start = dayAvailability.earliest_start_time ? 
        new Date(`1970-01-01T${dayAvailability.earliest_start_time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : '';
      const end = dayAvailability.latest_end_time ? 
        new Date(`1970-01-01T${dayAvailability.latest_end_time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : '';
      
      if (start && end) {
        timeText = `${start} - ${end}`;
      } else if (start) {
        timeText = `From ${start}`;
      } else if (end) {
        timeText = `Until ${end}`;
      }
    }

    return (
      <div
        style={{
          backgroundColor,
          color: textColor,
          padding: '8px',
          textAlign: 'center',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          minHeight: '50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2px'
        }}
        title={dayAvailability.notes ? `Notes: ${dayAvailability.notes}` : ''}
      >
        <div>{dayAvailability.status.toUpperCase()}</div>
        {timeText && (
          <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.9 }}>
            {timeText}
          </div>
        )}
        {dayAvailability.notes && (
          <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8 }}>
            📝
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading availability overview...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Team Availability Overview</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Weekly availability status for all employees. Click on any cell for details.
      </p>

      {/* Availability Grid */}
      <div style={{ 
        overflowX: 'auto',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: 'white'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '800px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid #d1d5db',
                borderRight: '1px solid #d1d5db',
                fontWeight: 'bold',
                minWidth: '200px'
              }}>
                Employee
              </th>
              {daysOfWeek.map(day => (
                <th key={day.id} style={{
                  padding: '12px',
                  textAlign: 'center',
                  borderBottom: '2px solid #d1d5db',
                  borderRight: day.id === 6 ? 'none' : '1px solid #d1d5db',
                  fontWeight: 'bold',
                  minWidth: '100px'
                }}>
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td style={{
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {employee.display_name || employee.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {employee.position}
                  </div>
                </td>
                {daysOfWeek.map(day => (
                  <td key={day.id} style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    borderRight: day.id === 6 ? 'none' : '1px solid #d1d5db'
                  }}>
                    {getAvailabilityCell(employee, day)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px'
      }}>
        {daysOfWeek.map(day => {
          const dayStats = employees.reduce((acc, employee) => {
            const employeeAvailability = availability[employee.id];
            const dayAvailability = employeeAvailability ? employeeAvailability[day.id] : null;
            
            if (dayAvailability) {
              acc[dayAvailability.status] = (acc[dayAvailability.status] || 0) + 1;
            } else {
              acc.notSet = (acc.notSet || 0) + 1;
            }
            return acc;
          }, {});

          return (
            <div key={day.id} style={{
              padding: '15px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>
                {day.fullName}
              </h4>
              <div style={{ fontSize: '12px', display: 'grid', gap: '2px' }}>
                <div style={{ color: '#16a34a' }}>
                  ✅ Available: {dayStats.green || 0}
                </div>
                <div style={{ color: '#ca8a04' }}>
                  ⚠️ Limited: {dayStats.yellow || 0}
                </div>
                <div style={{ color: '#dc2626' }}>
                  ❌ Unavailable: {dayStats.red || 0}
                </div>
                <div style={{ color: '#6b7280' }}>
                  ❓ Not Set: {dayStats.notSet || 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <h4>Legend:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: statusColors.green,
              borderRadius: '4px'
            }} />
            <span>GREEN - Fully Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: statusColors.yellow,
              borderRadius: '4px'
            }} />
            <span>YELLOW - Limited Availability</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: statusColors.red,
              borderRadius: '4px'
            }} />
            <span>RED - Unavailable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px'
            }} />
            <span>Not Set</span>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
          📝 = Has notes | Times shown are availability windows | Hover for notes
        </p>
      </div>
    </div>
  );
}