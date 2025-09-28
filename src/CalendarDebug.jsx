import React, { useEffect } from 'react';

const CalendarDebug = () => {
  const GOOGLE_CALENDAR_ID = 'fc4e0d1faabf03c4e7f0934b1087b4b244bda5f8d76bc3ae7f278e02e21d82eb@group.calendar.google.com';

  useEffect(() => {
    const testCalendarAccess = async () => {
      console.log('🔍 Testing Google Calendar access...');
      
      // Test CORS proxy access
      const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icalUrl)}`;
      
      console.log('📄 Direct iCal URL:', icalUrl);
      console.log('🔗 Proxy URL:', proxyUrl);
      
      try {
        console.log('📡 Trying proxy access...');
        const proxyResponse = await fetch(proxyUrl);
        console.log('✅ Proxy response status:', proxyResponse.status);
        
        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          console.log('📊 Proxy response keys:', Object.keys(proxyData));
          console.log('📈 Proxy status:', proxyData.status);
          
          if (proxyData.contents) {
            console.log('📝 Proxy contents length:', proxyData.contents.length);
            console.log('🔍 First 500 chars:', proxyData.contents.substring(0, 500));
            
            // Check if it contains calendar data
            if (proxyData.contents.includes('BEGIN:VCALENDAR')) {
              console.log('✅ Found valid iCal data!');
            } else {
              console.log('❌ No valid iCal data found');
            }
          } else {
            console.log('❌ No contents in proxy response');
          }
        } else {
          console.log('❌ Proxy response not ok');
        }
      } catch (proxyError) {
        console.log('❌ Proxy access failed:', proxyError.message);
        console.error('Full error:', proxyError);
      }
    };

    testCalendarAccess();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Google Calendar Debug Test</h3>
      <p>Check the browser console for test results.</p>
    </div>
  );
};

export default CalendarDebug;