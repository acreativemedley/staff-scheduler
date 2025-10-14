import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { parseDate, formatDateDisplay, formatTimeDisplay, getDateRange, getDaysCount } from './dateUtils';
import { useUser } from './UserContext-Minimal';
import { theme } from './theme';

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
      
      // Force fresh data by adding a timestamp to bypass caching
      const timestamp = Date.now();
      console.log('TimeOffManager: Fetching at timestamp:', timestamp);
      
      const { data: requestsData, error: requestsError } = await query
        .order('submitted_at', { ascending: false });
      
      console.log('TimeOffManager: Requests data:', requestsData);
      console.log('TimeOffManager: Requests error:', requestsError);
      console.log('TimeOffManager: Total requests fetched:', requestsData?.length || 0);
      
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
      
      console.log('TimeOffManager: Starting to group requests...');
      
      requestsWithEmployees.forEach(request => {
        if (request.is_recurring && !request.parent_request_id) {
          // This is a parent recurring request
          if (!processedParents.has(request.id)) {
            const instances = requestsWithEmployees.filter(r => r.parent_request_id === request.id);
            console.log(`TimeOffManager: Parent ${request.id} has ${instances.length} instances`);
            instances.forEach(inst => console.log(`  - Instance ${inst.id}: ${inst.start_date}`));
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
      console.log('TimeOffManager: Total grouped requests:', groupedRequests.length);
      setRequests(groupedRequests);
      try { window.dispatchEvent(new Event('timeOffUpdated')); } catch (e) { /* noop */ }
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
  // Refresh global list so other components (schedule) get the update
  await fetchTimeOffRequests();
  try { window.dispatchEvent(new Event('timeOffUpdated')); } catch (e) { /* noop */ }
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

    console.log('Attempting to delete occurrence with ID:', requestId);

    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', requestId)
        .select();

      console.log('Delete result - data:', data, 'error:', error);

      if (error) {
        console.error('Error deleting single occurrence:', error);
        alert('Error deleting occurrence: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No rows were deleted - the occurrence might not exist');
        alert('Warning: No occurrence was deleted. It might have already been removed.');
        return;
      }

      console.log('Successfully deleted occurrence:', data[0]);

      // Small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Refreshing time-off list...');
      
      // Refresh the entire list to ensure we have the latest data
      await fetchTimeOffRequests();
      
      console.log('Time-off list refreshed');
      
      // Dispatch event to notify other components (like the schedule)
      try { 
        window.dispatchEvent(new Event('timeOffUpdated')); 
        console.log('Dispatched timeOffUpdated event');
      } catch (e) { 
        console.error('Error dispatching event:', e);
      }

      console.log('Deletion complete!');
      // Success notification removed - the list update is the confirmation
    } catch (error) {
      console.error('Unexpected error in deleteSingleOccurrence:', error);
      alert('Unexpected error deleting occurrence: ' + error.message);
    }
  };

  const startEdit = (request) => {
    // Allow starting edit for either a regular request/series (parent) or a single occurrence
    // If the passed object is an occurrence (has parent_request_id) we'll edit that occurrence.
    const target = request || {};
    if (target.parent_request_id) {
      // editing a single generated occurrence
      setEditingRequest(target.id);
      setEditForm({
        start_date: target.start_date,
        end_date: target.end_date,
        request_type: target.request_type,
        partial_start_time: target.partial_start_time || '10:00',
        partial_end_time: target.partial_end_time || '18:00',
        reason: target.reason || ''
      });
    } else {
      // editing the parent/series or a normal single request
      setEditingRequest(target.id);
      setEditForm({
        start_date: target.start_date,
        end_date: target.end_date,
        request_type: target.request_type,
        partial_start_time: target.partial_start_time || '10:00',
        partial_end_time: target.partial_end_time || '18:00',
        reason: target.reason || ''
      });
    }
  };

  // Create a one-off occurrence for a parent recurring request on the chosen date.
  // Copies relevant fields from the parent and inserts a child request tied to parent_request_id.
  const createOccurrence = async (parentRequest, occurrenceDate) => {
    if (!parentRequest || !occurrenceDate) return null;

    try {
      // Check for duplicate occurrence on this date
      const { data: existingOccurrences, error: checkError } = await supabase
        .from('time_off_requests')
        .select('id, reason')
        .eq('employee_id', parentRequest.employee_id)
        .eq('start_date', occurrenceDate)
        .limit(1);

      if (checkError) {
        console.warn('Could not check for duplicate occurrence:', checkError);
        // Continue anyway
      } else if (existingOccurrences && existingOccurrences.length > 0) {
        alert(`⚠️ Duplicate Time-Off\n\nThis employee already has time-off on ${occurrenceDate}.\n\nReason: ${existingOccurrences[0].reason || '(No reason provided)'}\n\nPlease check existing requests before creating a new one.`);
        return null;
      }

      const insertBody = {
        employee_id: parentRequest.employee_id,
        start_date: occurrenceDate,
        end_date: occurrenceDate,
        request_type: parentRequest.request_type,
        partial_start_time: parentRequest.partial_start_time || null,
        partial_end_time: parentRequest.partial_end_time || null,
        reason: parentRequest.reason || null,
        // status intentionally omitted - approvals are not used
        parent_request_id: parentRequest.id,
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('time_off_requests')
        .insert([insertBody])
        .select();

      if (error) {
        console.error('Error creating occurrence:', error);
        alert('Error creating occurrence: ' + error.message);
        return null;
      }

      const newRow = Array.isArray(data) ? data[0] : data;

      // Refresh the list so the new instance appears; after refresh, start editing the new occurrence.
      await fetchTimeOffRequests();
      // Set editing state to the newly created instance
      if (newRow && newRow.id) {
        setEditingRequest(newRow.id);
        setEditForm({
          start_date: newRow.start_date,
          end_date: newRow.end_date,
          request_type: newRow.request_type,
          partial_start_time: newRow.partial_start_time || '09:00',
          partial_end_time: newRow.partial_end_time || '17:00',
          reason: newRow.reason || ''
        });
      }

      return newRow;
    } catch (err) {
      console.error('Unexpected error creating occurrence:', err);
      alert('Error creating occurrence: ' + err.message);
      return null;
    }
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
          reason: editForm.reason
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
  // Refresh global list so schedule reflects the edited times
  await fetchTimeOffRequests();
  try { window.dispatchEvent(new Event('timeOffUpdated')); } catch (e) { /* noop */ }
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

  // Status / approval removed intentionally; no UI or updates for status.

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
        <p style={{ marginBottom: '20px', color: theme.textSecondary }}>
        {canManageEmployees() 
          ? 'View and manage all time-off requests.'
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
          backgroundColor: theme.cardBg,
          borderRadius: '8px',
          alignItems: 'end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: theme.labelColor }}>
              Filter by Employee:
            </label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: theme.inputBg,
                color: theme.textPrimary
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
                backgroundColor: theme.gray,
                color: theme.white,
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
                backgroundColor: theme.primary,
                color: theme.primaryText,
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
          backgroundColor: theme.successBg,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.successText }}>
            {filteredRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: theme.success }}>
            Total Requests
          </div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: theme.infoBg,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.infoText }}>
            {upcomingRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: theme.info }}>
            Upcoming
          </div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: theme.warningBg,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.warningText }}>
            {pastRequests.length}
          </div>
          <div style={{ fontSize: '14px', color: theme.warningText }}>Past</div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: theme.cardBg,
          borderRadius: '8px',
          color: theme.textSecondary
        }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
          <div style={{ fontSize: '18px', marginBottom: '5px', color: theme.textPrimary }}>No time-off requests found</div>
          <div style={{ fontSize: '14px' }}>
            {!canManageEmployees() && !userProfile?.employee_id 
              ? 'Your account is not linked to an employee. Please contact an administrator.'
              : 'Requests will appear here once submitted'
            }
          </div>
          {!canManageEmployees() && (
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '10px' }}>
              Debug: Employee ID = {userProfile?.employee_id || 'Not set'}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Upcoming Requests */}
          {upcomingRequests.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: theme.textPrimary }}>
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
                    canManageEmployees={canManageEmployees}
                    createOccurrence={createOccurrence}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Requests */}
          {pastRequests.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '20px', color: theme.textPrimary }}>
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
                    isPast={true}
                    canManageEmployees={canManageEmployees}
                    createOccurrence={createOccurrence}
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
  isPast = false,
  canManageEmployees,
  createOccurrence
}) {
  const isEditing = editingRequest === request.id;
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [showAllInstances, setShowAllInstances] = useState(false);

  const normalizeDate = (d) => {
    if (!d) return null;
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return null;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      padding: '20px',
      backgroundColor: isPast ? theme.bgSecondary : theme.cardBg,
      opacity: isPast ? 0.8 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0', color: theme.textPrimary }}>
            {request.employees.display_name || request.employees.full_name}
              {request.isRecurringParent && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: theme.purpleBg,
                color: theme.purpleText,
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                RECURRING
              </span>
            )}
          </h4>
          <div style={{ fontSize: '14px', color: theme.textSecondary }}>
            {request.employees.position}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status removed: approvals are not used */}
          {isEditing ? (
            // Edit mode buttons
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => onSaveEdit(request.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme.success,
                  color: theme.white,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Save
              </button>
              {/* Allow deleting a single occurrence while in edit mode */}
              {request.parent_request_id && (
                <button
                  onClick={async () => {
                    if (!confirm('Delete this single occurrence? This will not affect the recurring series.')) return;
                    try {
                      await onDeleteSingle(request.id);
                      onCancelEdit();
                    } catch (err) {
                      console.error('Error deleting occurrence from edit panel', err);
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: theme.danger,
                    color: theme.white,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete This
                </button>
              )}
              <button
                onClick={onCancelEdit}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme.gray,
                  color: theme.white,
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
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
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
                      backgroundColor: theme.orange,
                      color: theme.white,
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
                      backgroundColor: theme.danger,
                      color: theme.white,
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
                  backgroundColor: theme.primaryBg,
                  color: theme.primary,
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
            backgroundColor: request.request_type === 'full_days' ? theme.warningBgLight : theme.successBgLight,
            color: request.request_type === 'full_days' ? theme.warningText : theme.successText,
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {request.request_type === 'full_days' ? 'Full Day(s)' : 'Partial Day'}
          </span>
          {request.request_type === 'partial_day' && (
            <span style={{ color: theme.textPrimary }}>
              Available: {formatTime(request.partial_start_time)} - {formatTime(request.partial_end_time)}
            </span>
          )}
        </div>

        {request.reason && !isEditing && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
            <strong style={{ color: theme.textPrimary }}>💬 Reason:</strong>
            <span style={{ flex: 1, color: theme.textPrimary }}>{request.reason}</span>
          </div>
        )}

        {isEditing && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: theme.inputDisabledBg, 
            borderRadius: '8px', 
            border: `1px solid ${theme.borderLight}` 
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: theme.textPrimary }}>Edit Request</h4>
            
              <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => onEditFormChange('start_date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: '4px',
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => onEditFormChange('end_date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: '4px',
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                  Request Type:
                </label>
                <select
                  value={editForm.request_type}
                  onChange={(e) => onEditFormChange('request_type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '4px',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary
                  }}
                >
                  <option value="full_days">Full Day(s)</option>
                  <option value="partial_day">Partial Day</option>
                </select>
              </div>

              {editForm.request_type === 'partial_day' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                      Available From:
                    </label>
                    <input
                      type="time"
                      value={editForm.partial_start_time}
                      onChange={(e) => onEditFormChange('partial_start_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: '4px',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                      Available Until:
                    </label>
                    <input
                      type="time"
                      value={editForm.partial_end_time}
                      onChange={(e) => onEditFormChange('partial_end_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: '4px',
                        backgroundColor: theme.inputBg,
                        color: theme.textPrimary
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Status control removed entirely */}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: theme.labelColor }}>
                  Reason:
                </label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => onEditFormChange('reason', e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '4px',
                    resize: 'vertical',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textSecondary }}>
          <strong>📝 Submitted:</strong>
          <span>{formatDate(request.submitted_at)}</span>
        </div>

        {/* Show recent instances for recurring requests */}
        {request.isRecurringParent && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: theme.inputBg, borderRadius: '4px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <strong style={{ fontSize: '14px', color: theme.textPrimary }}>
                Instances ({request.instances ? request.instances.length : 0} total):
              </strong>
              {request.instances && request.instances.length > 8 && (
                <button
                  onClick={() => setShowAllInstances(!showAllInstances)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: theme.cardBg,
                    color: theme.primary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {showAllInstances ? 'Show Less' : `Show All ${request.instances.length}`}
                </button>
              )}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {request.instances && (showAllInstances ? request.instances : request.instances.slice(0, 8)).map((instance) => (
                <div key={instance.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => onEdit(instance)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: theme.cardBg,
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`,
                      cursor: 'pointer'
                    }}
                  >
                    {formatDate(instance.start_date)}
                  </button>
                  <button
                    title="Delete this occurrence"
                    onClick={async () => {
                      if (!confirm('Delete this single occurrence?')) return;
                      try {
                        await onDeleteSingle(instance.id);
                      } catch (err) {
                        console.error('Error deleting instance from list', err);
                      }
                    }}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: theme.danger,
                      color: theme.white,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: theme.textSecondary }}>Jump to or create occurrence:</label>
              <input
                type="date"
                value={occurrenceDate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const date = normalizeDate(occurrenceDate);
                    if (date) createOccurrence(request, date);
                  }
                }}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                style={{
                  padding: '6px',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '4px',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  fontSize: '13px'
                }}
              />
              <button
                onClick={() => {
                  const date = normalizeDate(occurrenceDate);
                  if (!date) {
                    alert('Please pick a date to create or jump to an occurrence');
                    return;
                  }
                  const existing = request.instances && request.instances.find(i => normalizeDate(i.start_date) === date);
                  if (existing) {
                    onEdit(existing);
                  } else {
                    createOccurrence(request, date);
                  }
                }}
                style={{
                  padding: '6px 10px',
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Go
              </button>
              <div style={{ marginLeft: 'auto', fontSize: '12px', color: theme.textSecondary }}>
                You can select a recent instance or enter any date to create a single occurrence for this series and edit it.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}