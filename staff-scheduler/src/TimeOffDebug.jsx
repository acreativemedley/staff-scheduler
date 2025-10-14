// Quick debug component to check time-off data
// Add this to your App.jsx temporarily or run in browser console

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function TimeOffDebug() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkData = async () => {
      // Check current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('Current user:', user);

      // Try to fetch time-off requests
      console.log('Fetching time-off requests...');
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off_requests')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Time-off data:', timeOffData);
      console.log('Time-off error:', timeOffError);

      setData(timeOffData);
      setError(timeOffError);
    };

    checkData();
  }, []);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f0f0f0', margin: '1rem', border: '2px solid red' }}>
      <h2>🔍 Time-Off Debug Info</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Current User:</strong>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Time-Off Requests Count:</strong> {data?.length || 0}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', padding: '1rem', marginBottom: '1rem' }}>
          <strong>Error:</strong>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <strong>Sample Request:</strong>
          <pre>{JSON.stringify(data[0], null, 2)}</pre>
        </div>
      )}

      {data && data.length === 0 && (
        <div style={{ backgroundColor: '#ffffcc', padding: '1rem' }}>
          ⚠️ No time-off requests found in database!
        </div>
      )}
    </div>
  );
}
