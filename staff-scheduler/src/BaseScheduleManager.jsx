import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function BaseScheduleManager() {
  const [employees, setEmployees] = useState([]);
  const [baseSchedule, setBaseSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newEntry, setNewEntry] = useState({
    employee_id: '',
    day_of_week: 0, // Start with Sunday
    start_time: '10:00',
    end_time: '18:00',
    notes: ''
  });

  const days = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchBaseSchedule()]);
    setLoading(false);
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

  const fetchBaseSchedule = async () => {
    const { data, error } = await supabase
      .from('base_schedule')
      .select(`
        *,
        employees (full_name, display_name, position)
      `)
      .eq('is_active', true)
      .order(['day_of_week', 'start_time', 'employees(full_name)']);
    
    if (error) {
      console.error('Error fetching base schedule:', error);
    } else {
      setBaseSchedule(data || []);
    }
  };

  const addScheduleEntry = async () => {
    if (!newEntry.employee_id) {
      alert('Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === newEntry.employee_id);
    const entryData = {
      employee_id: newEntry.employee_id,
      day_of_week: newEntry.day_of_week,
      start_time: newEntry.start_time,
      end_time: newEntry.end_time,
      position: employee?.position || '',
      notes: newEntry.notes || null
    };

    const { error } = await supabase
      .from('base_schedule')
      .insert([entryData]);

    if (error) {
      console.error('Error adding schedule entry:', error);
      alert('Error adding schedule entry: ' + error.message);
    } else {
      setNewEntry({
        employee_id: '',
        day_of_week: 1,
        start_time: '10:00',
        end_time: '18:00',
        notes: ''
      });
      fetchBaseSchedule();
    }
  };

  const deleteScheduleEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) {
      return;
    }

    const { error } = await supabase
      .from('base_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule entry:', error);
      alert('Error deleting schedule entry: ' + error.message);
    } else {
      fetchBaseSchedule();
    }
  };

  const updateScheduleEntry = async (id, updates) => {
    const { error } = await supabase
      .from('base_schedule')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating schedule entry:', error);
      alert('Error updating schedule entry: ' + error.message);
    } else {
      setEditing(null);
      setEditForm({});
      fetchBaseSchedule();
    }
  };

  const startEditing = (entry) => {
    setEditing(entry.id);
    setEditForm({
      employee_id: entry.employee_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      notes: entry.notes || ''
    });
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdit = async () => {
    if (!editForm.employee_id) {
      alert('Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === editForm.employee_id);
    const updates = {
      employee_id: editForm.employee_id,
      day_of_week: editForm.day_of_week,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      position: employee?.position || '',
      notes: editForm.notes || null
    };

    await updateScheduleEntry(editing, updates);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDayLabel = (dayOfWeek) => {
    return days.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };

  const groupedSchedule = days.map(day => ({
    ...day,
    entries: baseSchedule.filter(entry => entry.day_of_week === day.value)
  }));

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading base schedule...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Base Schedule Manager</h2>
      <p style={{ marginBottom: '30px', color: '#6b7280' }}>
        Define your standard weekly schedule. This will be used as the base for the schedule generator, 
        with time-off conflicts highlighted in red.
      </p>

      {/* Add New Entry */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Add New Schedule Entry</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Employee:
            </label>
            <select
              value={newEntry.employee_id}
              onChange={(e) => setNewEntry(prev => ({ ...prev, employee_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="">Select employee...</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.display_name || employee.full_name} ({employee.position})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Day:
            </label>
            <select
              value={newEntry.day_of_week}
              onChange={(e) => setNewEntry(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              {days.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Start Time:
            </label>
            <input
              type="time"
              value={newEntry.start_time}
              onChange={(e) => setNewEntry(prev => ({ ...prev, start_time: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              End Time:
            </label>
            <input
              type="time"
              value={newEntry.end_time}
              onChange={(e) => setNewEntry(prev => ({ ...prev, end_time: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Notes:
            </label>
            <input
              type="text"
              value={newEntry.notes}
              onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={addScheduleEntry}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Current Schedule */}
      <div>
        <h3 style={{ marginBottom: '20px' }}>Current Base Schedule</h3>
        {groupedSchedule.map(day => (
          <div key={day.value} style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              margin: '0 0 10px 0', 
              padding: '8px 12px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              borderRadius: '4px',
              fontSize: '16px'
            }}>
              {day.label} ({day.entries.length} shift{day.entries.length !== 1 ? 's' : ''})
            </h4>
            
            {day.entries.length === 0 ? (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f9fafb', 
                color: '#6b7280', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                No shifts scheduled for {day.label}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {day.entries.map(entry => (
                  <div 
                    key={entry.id}
                    style={{
                      padding: '15px',
                      backgroundColor: editing === entry.id ? '#fff3cd' : 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  >
                    {editing === entry.id ? (
                      // Edit Mode
                      <div>
                        <div style={{ marginBottom: '15px', color: '#856404', fontWeight: 'bold' }}>
                          Editing Shift
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                              Employee:
                            </label>
                            <select
                              value={editForm.employee_id}
                              onChange={(e) => handleEditChange('employee_id', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.display_name || employee.full_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                              Day:
                            </label>
                            <select
                              value={editForm.day_of_week}
                              onChange={(e) => handleEditChange('day_of_week', parseInt(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {days.map(day => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                              Start:
                            </label>
                            <input
                              type="time"
                              value={editForm.start_time}
                              onChange={(e) => handleEditChange('start_time', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            />
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                              End:
                            </label>
                            <input
                              type="time"
                              value={editForm.end_time}
                              onChange={(e) => handleEditChange('end_time', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            />
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                              Notes:
                            </label>
                            <input
                              type="text"
                              value={editForm.notes}
                              onChange={(e) => handleEditChange('notes', e.target.value)}
                              placeholder="Optional notes..."
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={cancelEditing}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEdit}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#374151' }}>
                            {entry.employees?.display_name || entry.employees?.full_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                            {entry.employees?.position} • {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            {entry.notes && ` • ${entry.notes}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => startEditing(entry)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteScheduleEntry(entry.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#dbeafe', 
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <strong>📊 Schedule Summary:</strong>
        <div style={{ marginTop: '8px', fontSize: '14px' }}>
          Total shifts per week: <strong>{baseSchedule.length}</strong>
          {groupedSchedule.map(day => (
            <span key={day.value} style={{ marginLeft: '15px' }}>
              {day.label}: {day.entries.length}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}