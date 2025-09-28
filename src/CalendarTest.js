// Test script to check Google Calendar iCal feed access
const GOOGLE_CALENDAR_ID = 'fc4e0d1faabf03c4e7f0934b1087b4b244bda5f8d76bc3ae7f278e02e21d82eb@group.calendar.google.com';

async function testCalendarAccess() {
  console.log('Testing Google Calendar access...');
  
  // Test direct iCal access (will likely fail due to CORS)
  const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`;
  console.log('Direct iCal URL:', icalUrl);
  
  try {
    console.log('Trying direct access...');
    const directResponse = await fetch(icalUrl);
    console.log('Direct access status:', directResponse.status);
    if (directResponse.ok) {
      const directText = await directResponse.text();
      console.log('Direct access worked! Data length:', directText.length);
      console.log('First 500 chars:', directText.substring(0, 500));
    }
  } catch (directError) {
    console.log('Direct access failed (expected due to CORS):', directError.message);
  }
  
  // Test CORS proxy access
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icalUrl)}`;
  console.log('Proxy URL:', proxyUrl);
  
  try {
    console.log('Trying proxy access...');
    const proxyResponse = await fetch(proxyUrl);
    console.log('Proxy response status:', proxyResponse.status);
    
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      console.log('Proxy response keys:', Object.keys(proxyData));
      console.log('Proxy status:', proxyData.status);
      
      if (proxyData.contents) {
        console.log('Proxy contents length:', proxyData.contents.length);
        console.log('First 500 chars:', proxyData.contents.substring(0, 500));
      } else {
        console.log('No contents in proxy response');
      }
    } else {
      console.log('Proxy response not ok');
    }
  } catch (proxyError) {
    console.log('Proxy access failed:', proxyError.message);
  }
}

// Run the test
testCalendarAccess();