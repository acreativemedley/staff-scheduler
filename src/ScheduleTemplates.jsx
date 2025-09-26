import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ScheduleTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .order('day_of_week');
    
    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      // Ensure we have a template for each day
      const templateMap = {};
      data.forEach(template => {
        templateMap[template.day_of_week] = template;
      });

      const completeTemplates = daysOfWeek.map(day => {
        return templateMap[day.id] || {
          day_of_week: day.id,
          name: `${day.name} Template`,
          store_open_time: '10:00',
          store_close_time: '18:00',
          required_managers: day.id === 0 ? 0 : 1, // Sunday has 0 managers by default
          required_staff: day.id === 0 ? 3 : 4,    // Sunday has 3 staff by default
          is_active: true
        };
      });

      setTemplates(completeTemplates);
    }
    setLoading(false);
  };

  const updateTemplate = (dayId, field, value) => {
    setTemplates(prev => prev.map(template => 
      template.day_of_week === dayId 
        ? { ...template, [field]: value }
        : template
    ));
  };

  const saveTemplates = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Delete existing templates and insert new ones
      await supabase.from('schedule_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const templatesToInsert = templates.map(template => ({
        name: template.name,
        day_of_week: template.day_of_week,
        store_open_time: template.store_open_time,
        store_close_time: template.store_close_time,
        required_managers: template.required_managers,
        required_staff: template.required_staff,
        is_active: template.is_active
      }));

      const { error } = await supabase
        .from('schedule_templates')
        .insert(templatesToInsert);

      if (error) throw error;

      setMessage('Schedule templates saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh to get the IDs
      fetchTemplates();
    } catch (error) {
      console.error('Error saving templates:', error);
      setMessage('Error saving templates: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    }
    
    setSaving(false);
  };

  const resetToDefaults = () => {
    if (!confirm('Reset all templates to default values? This will overwrite your current settings.')) {
      return;
    }

    const defaultTemplates = daysOfWeek.map(day => ({
      day_of_week: day.id,
      name: `${day.name} Template`,
      store_open_time: '10:00',
      store_close_time: day.id === 5 ? '17:00' : day.id === 6 ? '16:00' : day.id === 0 ? '15:00' : '18:00',
      required_managers: day.id === 0 ? 0 : 1,
      required_staff: day.id === 0 ? 3 : 4,
      is_active: true
    }));

    setTemplates(defaultTemplates);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getHoursCount = (openTime, closeTime) => {
    if (!openTime || !closeTime) return 0;
    const open = new Date(`1970-01-01T${openTime}`);
    const close = new Date(`1970-01-01T${closeTime}`);
    return Math.round((close - open) / (1000 * 60 * 60) * 10) / 10;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading schedule templates...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Schedule Templates</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Configure your base schedule templates for each day of the week. These define store hours and staffing requirements.
      </p>

      {/* Action Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={saveTemplates}
          disabled={saving}
          style={{
            backgroundColor: saving ? '#9ca3af' : '#10b981',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {saving ? 'Saving...' : '💾 Save Templates'}
        </button>
        <button
          onClick={resetToDefaults}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Reset to Defaults
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

      {/* Templates Grid */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {templates.map((template, index) => {
          const dayInfo = daysOfWeek.find(d => d.id === template.day_of_week);
          const hoursCount = getHoursCount(template.store_open_time, template.store_close_time);
          const totalStaff = template.required_managers + template.required_staff;
          
          return (
            <div
              key={template.day_of_week}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: template.is_active ? 'white' : '#f9fafb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#374151' }}>
                  {dayInfo?.name}
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '10px' }}>
                    ({hoursCount}h • {totalStaff} total staff)
                  </span>
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => updateTemplate(template.day_of_week, 'is_active', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: template.is_active ? '#16a34a' : '#6b7280' }}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {/* Store Hours */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Store Open Time:
                  </label>
                  <input
                    type="time"
                    value={template.store_open_time}
                    onChange={(e) => updateTemplate(template.day_of_week, 'store_open_time', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {formatTime(template.store_open_time)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Store Close Time:
                  </label>
                  <input
                    type="time"
                    value={template.store_close_time}
                    onChange={(e) => updateTemplate(template.day_of_week, 'store_close_time', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {formatTime(template.store_close_time)}
                  </div>
                </div>

                {/* Staffing */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Required Managers:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={template.required_managers}
                    onChange={(e) => updateTemplate(template.day_of_week, 'required_managers', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Required Staff:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={template.required_staff}
                    onChange={(e) => updateTemplate(template.day_of_week, 'required_staff', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Template Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Template Name:
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => updateTemplate(template.day_of_week, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <strong>Summary:</strong> {formatTime(template.store_open_time)} - {formatTime(template.store_close_time)} 
                ({hoursCount} hours) • {template.required_managers} manager{template.required_managers !== 1 ? 's' : ''} + {template.required_staff} staff = {totalStaff} total
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <h3>Weekly Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '15px' }}>
          {templates.filter(t => t.is_active).map(template => {
            const dayInfo = daysOfWeek.find(d => d.id === template.day_of_week);
            const hours = getHoursCount(template.store_open_time, template.store_close_time);
            const totalStaff = template.required_managers + template.required_staff;
            
            return (
              <div key={template.day_of_week} style={{
                textAlign: 'center',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{dayInfo?.shortName}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{hours}h</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{totalStaff} staff</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}