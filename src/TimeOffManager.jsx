import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { parseDate, formatDateDisplay, formatTimeDisplay, getDateRange, getDaysCount } from './dateUtils';
import { useUser } from './UserContext-Minimal';

export default function TimeOffManager() {
  const { userProfile, canManageEmployees } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchTimeOffRequests();
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
    }
  };

  const fetchTimeOffRequests = async () => {
    setLoading(true);
    
    try {
      console.log('TimeOffManager: Fetching requests...');
      console.log('TimeOffManager: canManageEmployees:', canManageEmployees());
      console.log('TimeOffManager: userProfile:', userProfile);
      console.log('TimeOffManager: employee_id:', userProfile?.employee_id);
      
      // Build query - if staff, only fetch their own requests
      let query = supabase
        .from('time_off_requests')
        .select('*');
      
      // If user is staff (not manager/admin), filter by their employee_id
      if (!canManageEmployees() && userProfile?.employee_id) {
        console.log('TimeOffManager: Filtering by employee_id:', userProfile.employee_id);
        query = query.eq('employee_id', userProfile.employee_id);
      }
      
      const { data: requestsData, error: requestsError } = await query
        .order('submitted_at', { ascending: false });
      
      console.log('TimeOffManager: Requests data:', requestsData);
      console.log('TimeOffManager: Requests error:', requestsError);
      
      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        setLoading(false);
        return;
      }

      // Then get the employees separately
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, display_name, position');
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        setLoading(false);
        return;
      }

      // Combine the data
      const requestsWithEmployees = requestsData.map(request => {
        const employee = employeesData.find(emp => emp.id === request.employee_id);
        return {
          ...request,
          employees: employee || { full_name: 'Unknown', display_name: '', position: 'Unknown' }
        };
      });

      // Group recurring requests with their instances
      const groupedRequests = [];
      const processedParents = new Set();
      
      requestsWithEmployees.forEach(request => {
        if (request.is_recurring && !request.parent_request_id) {
          // This is a parent recurring request
          if (!processedParents.has(request.id)) {
            const instances = requestsWithEmployees.filter(r => r.parent_request_id === request.id);
            groupedRequests.push({
              ...request,
              isRecurringParent: true,
              instances: instances
            });
            processedParents.add(request.id);
          }
        } else if (!request.parent_request_id) {
          // This is a regular request (not recurring)
          groupedRequests.push(request);
        }
        // Skip instances - they're included with their parent
      });

      console.log('Fetched requests:', groupedRequests);
      setRequests(groupedRequests);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
    
    setLoading(false);
  };

  const deleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this time-off request? This will also delete any related recurring requests.')) {
      return;
    }

    try {
      // First, delete all child requests (recurring instances) that reference this request as parent
      const { error: childError } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('parent_request_id', requestId);

      if (childError) {
        console.error('Error deleting child requests:', childError);
        alert('Error deleting recurring requests: ' + childError.message);
        return;
      }

      // Then delete the main request
      const { error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting request:', error);
        alert('Error deleting request: ' + error.message);
      } else {
        // Remove all related requests from the state (parent and any children)
        setRequests(prev => prev.filter(req => 
          req.id !== requestId && req.parent_request_id !== requestId
        ));
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      alert('Error deleting request: ' + error.message);
    }
  };

  const deleteSingleOccurrence = async (requestId) => {
    if (!confirm('Are you sure you want to delete this single occurrence? The recurring pattern will continue for other dates.')) {
      return;
    }

    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting single occurrence:', error);
      alert('Error deleting occurrence: ' + error.message);
    } else {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const startEdit = (request) => {
    setEditingRequest(request.id);
    setEditForm({
      start_date: request.start_date,
      end_date: request.end_date,
      request_type: request.request_type,
      partial_start_time: request.partial_start_time || '09:00',
      partial_end_time: request.partial_end_time || '17:00',
      reason: request.reason || '',
      status: request.status
    });
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setEditForm({});
  };

  const saveEdit = async (requestId) => {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .update({
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          request_type: editForm.request_type,
          partial_start_time: editForm.request_type === 'partial_day' ? editForm.partial_start_time : null,
          partial_end_time: editForm.request_type === 'partial_day' ? editForm.partial_end_time : null,
          reason: editForm.reason,
          status: editForm.status
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request:', error);
        alert('Error updating request: ' + error.message);
      } else {
        // Update the request in the local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, ...editForm }
            : req
        ));
        setEditingRequest(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error in update operation:', error);
      alert('Error updating request: ' + error.message);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Use centralized date utilities instead of local functions
  const formatDate = formatDateDisplay;
  const formatTime = formatTimeDisplay;

  // Remove duplicate functions - using imported utilities
  // getDateRange and getDaysCount are imported from dateUtils.js
  // parseDate is imported from dateUtils.js

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'denied': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filterEmployee !== 'all' && request.employee_id !== filterEmployee) return false;
    return true;
  });

  const upcomingRequests = filteredRequests.filter(request => 
    parseDate(request.start_date) >= new Date()
  );
  
  const pastRequests = filteredRequests.filter(request => 
    parseDate(request.end_date) < new Date()
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading time-off requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>{canManageEmployees() ? 'Manage Time-Off Requests' : 'My Time-Off Requests'}</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        {canManageEmployees() 
          ? 'View and manage all time-off requests. Requests are automatically approved.'
          : 'View and manage your own time-off requests. You can edit or delete your requests here.'
        }
      </p>

      {/* Filters */}
      {canManageEmployees() && (
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          alignItems: 'end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Filter by Employee:
            </label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.display_name || employee.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => setFilterEmployee('all')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              Clear Filter
            </button>
            <button
              onClick={fetchTimeOffRequests}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
            {filteredRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: '#15803d' }}>Total Requests</div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>
            {upcomingRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: '#0369a1' }}>Upcoming</div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
            {pastRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: '#78350f' }}>Past</div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>No time-off requests found</div>
          <div style={{ fontSize: '14px' }}>
            {!canManageEmployees() && !userProfile?.employee_id 
              ? 'Your account is not linked to an employee. Please contact an administrator.'
              : 'Requests will appear here once submitted'
            }
          </div>
          {!canManageEmployees() && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
              Debug: Employee ID = {userProfile?.employee_id || 'Not set'}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Upcoming Requests */}
          {upcomingRequests.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: '#374151' }}>
                Upcoming Requests ({upcomingRequests.length})
              </h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {upcomingRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onDelete={deleteRequest}
                    onDeleteSingle={deleteSingleOccurrence}
                    onEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    editingRequest={editingRequest}
                    editForm={editForm}
                    onEditFormChange={handleEditFormChange}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getDateRange={getDateRange}
                    getDaysCount={getDaysCount}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Requests */}
          {pastRequests.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '20px', color: '#374151' }}>
                Past Requests ({pastRequests.length})
              </h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {pastRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onDelete={deleteRequest}
                    onDeleteSingle={deleteSingleOccurrence}
                    onEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    editingRequest={editingRequest}
                    editForm={editForm}
                    onEditFormChange={handleEditFormChange}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getDateRange={getDateRange}
                    getDaysCount={getDaysCount}
                    getStatusColor={getStatusColor}
                    isPast={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  onDelete,
  onDeleteSingle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  editingRequest,
  editForm,
  onEditFormChange,
  formatDate,
  formatTime,
  getDateRange,
  getDaysCount,
  getStatusColor,
  isPast = false
}) {
  const isEditing = editingRequest === request.id;
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: isPast ? '#f9fafb' : 'white',
      opacity: isPast ? 0.8 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0', color: '#374151' }}>
            {request.employees.display_name || request.employees.full_name}
            {request.isRecurringParent && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                RECURRING
              </span>
            )}
          </h4>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {request.employees.position}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: getStatusColor(request.status)
          }}>
            {request.status.toUpperCase()}
          </span>
          {isEditing ? (
            // Edit mode buttons
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => onSaveEdit(request.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Save
              </button>
              <button
                onClick={onCancelEdit}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            // Normal mode buttons
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => onEdit(request)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Edit
              </button>
              {request.parent_request_id ? (
                // Single occurrence delete for recurring instances
                <button
                  onClick={() => onDeleteSingle(request.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ea580c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete This
                </button>
              ) : (
                // Full delete for regular requests or parent recurring requests
                <button
                  onClick={() => onDelete(request.id)}
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
                  {request.isRecurringParent ? 'Delete All' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {request.isRecurringParent ? (
          // Show recurring pattern information
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>🔄 Pattern:</strong>
              <span style={{ textTransform: 'capitalize' }}>
                {request.recurrence_pattern === 'biweekly' ? 'Every Other Week' : 
                 request.recurrence_pattern === 'weekly' ? `Every ${request.recurrence_interval} Week${request.recurrence_interval > 1 ? 's' : ''}` :
                 request.recurrence_pattern === 'monthly' ? `Every ${request.recurrence_interval} Month${request.recurrence_interval > 1 ? 's' : ''}` :
                 request.recurrence_pattern}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>📅 Pattern Dates:</strong>
              <span>{formatDate(request.recurrence_start_date)} to {formatDate(request.recurrence_end_date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>📊 Instances:</strong>
              <span>
                {request.instances ? `${request.instances.length} occurrences generated` : 'No instances found'}
              </span>
            </div>
          </>
        ) : (
          // Show regular request information
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>📅 Dates:</strong>
              <span>{getDateRange(request.start_date, request.end_date)}</span>
              {request.request_type === 'full_days' && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {getDaysCount(request.start_date, request.end_date)} day{getDaysCount(request.start_date, request.end_date) > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong>⏰ Type:</strong>
          <span style={{
            padding: '2px 8px',
            backgroundColor: request.request_type === 'full_days' ? '#fef3c7' : '#ecfdf5',
            color: request.request_type === 'full_days' ? '#92400e' : '#065f46',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {request.request_type === 'full_days' ? 'Full Day(s)' : 'Partial Day'}
          </span>
          {request.request_type === 'partial_day' && (
            <span>
              Available: {formatTime(request.partial_start_time)} - {formatTime(request.partial_end_time)}
            </span>
          )}
        </div>

        {request.reason && !isEditing && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
            <strong>💬 Reason:</strong>
            <span style={{ flex: 1 }}>{request.reason}</span>
          </div>
        )}

        {isEditing && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px', 
            border: '1px solid #f59e0b' 
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#92400e' }}>Edit Request</h4>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => onEditFormChange('start_date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => onEditFormChange('end_date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                  Request Type:
                </label>
                <select
                  value={editForm.request_type}
                  onChange={(e) => onEditFormChange('request_type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="full_days">Full Day(s)</option>
                  <option value="partial_day">Partial Day</option>
                </select>
              </div>

              {editForm.request_type === 'partial_day' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                      Available From:
                    </label>
                    <input
                      type="time"
                      value={editForm.partial_start_time}
                      onChange={(e) => onEditFormChange('partial_start_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                      Available Until:
                    </label>
                    <input
                      type="time"
                      value={editForm.partial_end_time}
                      onChange={(e) => onEditFormChange('partial_end_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                  Status:
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => onEditFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                  Reason:
                </label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => onEditFormChange('reason', e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6b7280' }}>
          <strong>📝 Submitted:</strong>
          <span>{formatDate(request.submitted_at)}</span>
        </div>

        {/* Show recent instances for recurring requests */}
        {request.isRecurringParent && request.instances && request.instances.length > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
            <strong style={{ fontSize: '14px' }}>Recent Instances:</strong>
            <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {request.instances.slice(0, 8).map((instance, index) => (
                <span
                  key={instance.id}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#475569'
                  }}
                >
                  {formatDate(instance.start_date)}
                </span>
              ))}
              {request.instances.length > 8 && (
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  +{request.instances.length - 8} more...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}