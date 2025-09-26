import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      console.log('=== Supabase Connection Test ===')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      console.log('Supabase URL:', supabaseUrl)
      console.log('Supabase Key (first 20 chars):', supabaseKey?.substring(0, 20))
      console.log('Supabase Key (last 10 chars):', supabaseKey?.substring(supabaseKey.length - 10))
      
      if (!supabaseUrl || !supabaseKey) {
        setConnectionStatus('❌ Environment variables not loaded correctly')
        return
      }
      
      // Test 1: Basic client connection
      console.log('Test 1: Testing Supabase client...')
      console.log('Supabase client:', supabase)
      
      // Test 2: Test with a simple request to auth
      console.log('Test 2: Testing auth session...')
      const { data: authData, error: authError } = await supabase.auth.getSession()
      console.log('Auth test result:', { authData, authError })
      
      if (authError) {
        setConnectionStatus(`❌ Auth Error: ${authError.message}`)
        return
      }
      
      // Test 3: Test direct HTTP fetch to Supabase
      console.log('Test 3: Testing direct HTTP request...')
      const response = await fetch(`${supabaseUrl}/rest/v1/employees?select=count`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      })
      
      console.log('HTTP response status:', response.status)
      console.log('HTTP response headers:', [...response.headers.entries()])
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error:', errorText)
        setConnectionStatus(`❌ HTTP Error ${response.status}: ${errorText}`)
        return
      }
      
      const httpResult = await response.text()
      console.log('HTTP response body:', httpResult)
      
      // Test 4: Test Supabase client query
      console.log('Test 4: Testing Supabase client query...')
      const { data, error, count } = await supabase
        .from('employees')
        .select('*', { count: 'exact' })
      
      console.log('Supabase query result:', { data, error, count })
      
      if (error) {
        setConnectionStatus(`❌ Database Error: ${error.message}`)
      } else {
        setConnectionStatus(`✅ All tests passed! Found ${count} employees in database.`)
      }
      
    } catch (err) {
      console.error('Connection test failed:', err)
      setConnectionStatus(`❌ Connection Failed: ${err.message}`)
    }
  }

  return (
    <div style={{
      padding: '1rem',
      margin: '1rem 0',
      border: '1px solid #ccc',
      borderRadius: '4px',
      backgroundColor: connectionStatus.includes('✅') ? '#efe' : '#fee'
    }}>
      <h4>Connection Status:</h4>
      <p>{connectionStatus}</p>
      <button onClick={testConnection} style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#0066cc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Test Again
      </button>
    </div>
  )
}

export default ConnectionTest