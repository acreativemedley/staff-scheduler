import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useUser } from './UserContext-Minimal';
import { theme } from './theme';
import { parseDate, formatDateForInput } from './dateUtils';

// Helper function to format time as h:mm AM/PM
const formatTimeAmPm = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Parse time string (format: "HH:mm:ss" or "HH:mm")
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export default function MySchedulePrinter({ isOpen, onClose, userProfile }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (isOpen) {
      fetchUserSchedule();
    }
  }, [isOpen]);

  const fetchUserSchedule = async () => {
    setLoading(true);
    setError('');
    setShifts([]);

    try {
      if (!userProfile?.employee_id) {
        setError('Employee ID not found in profile');
        setLoading(false);
        return;
      }

      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      // Fetch all saved weekly schedules for this user from today forward
      const { data, error: fetchError } = await supabase
        .from('weekly_schedules')
        .select(`
          id,
          week_start_date,
          schedule_date,
          start_time,
          end_time,
          position,
          notes
        `)
        .eq('employee_id', userProfile.employee_id)
        .gte('schedule_date', todayString)
        .order('schedule_date', { ascending: true });

      if (fetchError) {
        console.error('Error fetching schedule:', fetchError);
        setError('Failed to load your schedule: ' + fetchError.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('No scheduled shifts found from today forward');
        setShifts([]);
        setLoading(false);
        return;
      }

      console.log('Fetched user shifts:', data);
      setShifts(data);

      // Calculate date range for display
      if (data.length > 0) {
        const dates = data.map(s => parseDate(s.schedule_date)).sort((a, b) => a - b);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        setDateRange({
          start: startDate.toLocaleDateString(),
          end: endDate.toLocaleDateString()
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching user schedule:', err);
      setError('An error occurred: ' + err.message);
      setLoading(false);
    }
  };

  const printSchedule = () => {
    const printWindow = window.open('', '', 'width=800,height=600');

    const shiftSummary = shifts
      .map(
        shift =>
          `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${parseDate(shift.schedule_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatTimeAmPm(shift.start_time)} - ${formatTimeAmPm(shift.end_time)}</td>
          </tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>My Schedule</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background-color: #fff;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 10px;
            }
            .info {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #007bff;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #0056b3;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f0f0f0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <h1>My Schedule</h1>
          <div class="info">
            ${dateRange.start ? `Period: ${dateRange.start} - ${dateRange.end}` : ''}
            <br>
            Printed: ${new Date().toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${shiftSummary}
            </tbody>
          </table>
          <div class="footer">
            <p>Your confirmed schedule</p>
            <p>Please contact Ann ASAP if there are any issues</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `${theme.bgPrimary}40`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.bgPrimary,
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3)`,
          border: `1px solid ${theme.border}`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: theme.textPrimary, margin: 0 }}>My Schedule</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: theme.textPrimary,
              padding: 0,
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: theme.textSecondary }}>
            Loading your schedule...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: '15px',
              backgroundColor: theme.bgSecondary,
              borderRadius: '6px',
              color: theme.danger,
              marginBottom: '20px',
              border: `1px solid ${theme.danger}`
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && shifts.length > 0 && (
          <div>
            <div
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: theme.bgSecondary,
                borderRadius: '6px',
                border: `1px solid ${theme.border}`
              }}
            >
              <p style={{ margin: '0 0 10px 0', color: theme.textPrimary }}>
                <strong>Total Shifts: {shifts.length}</strong>
              </p>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px' }}>
                {dateRange.start && `${dateRange.start} - ${dateRange.end}`}
              </p>
            </div>

            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '20px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: theme.bgSecondary, borderBottom: `2px solid ${theme.border}` }}>
                    <th
                      style={{
                        padding: '10px',
                        textAlign: 'left',
                        color: theme.textPrimary,
                        fontWeight: 'bold',
                        borderRight: `1px solid ${theme.border}`
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: '10px',
                        textAlign: 'left',
                        color: theme.textPrimary,
                        fontWeight: 'bold'
                      }}
                    >
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift, index) => (
                    <tr
                      key={shift.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? theme.bgPrimary : theme.bgSecondary,
                        borderBottom: `1px solid ${theme.border}`,
                        ':hover': {
                          backgroundColor: theme.bgSecondary
                        }
                      }}
                    >
                      <td style={{ padding: '10px', borderRight: `1px solid ${theme.border}`, color: theme.textPrimary }}>
                        {parseDate(shift.schedule_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '10px', color: theme.textPrimary }}>
                        {formatTimeAmPm(shift.start_time)} - {formatTimeAmPm(shift.end_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.bgSecondary,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
              <button
                onClick={printSchedule}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.success,
                  color: theme.primaryText,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🖨️ Print Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
