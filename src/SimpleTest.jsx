import { useState } from 'react'

function SimpleTest() {
  const [result, setResult] = useState('')

  const testBasicFetch = async () => {
    try {
      setResult('Testing basic fetch...')
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const data = await response.json()
      setResult(`✅ Basic fetch works: ${data.title}`)
    } catch (err) {
      setResult(`❌ Basic fetch failed: ${err.message}`)
    }
  }

  const testSupabaseUrl = async () => {
    try {
      setResult('Testing Supabase URL...')
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        setResult('❌ Environment variables missing')
        return
      }

      setResult(`URL: ${url}, Key: ${key.substring(0, 20)}...`)
      
      const response = await fetch(`${url}/rest/v1/employees?select=count`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.text()
        setResult(`✅ Direct Supabase fetch works: ${data}`)
      } else {
        const error = await response.text()
        setResult(`❌ Supabase fetch failed (${response.status}): ${error}`)
      }
    } catch (err) {
      setResult(`❌ Supabase fetch error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', margin: '1rem' }}>
      <h3>Simple Connection Tests</h3>
      
      <button onClick={testBasicFetch} style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}>
        Test Basic Fetch
      </button>
      
      <button onClick={testSupabaseUrl} style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}>
        Test Supabase Direct
      </button>
      
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        minHeight: '50px'
      }}>
        {result || 'Click a button to test...'}
      </div>
    </div>
  )
}

export default SimpleTest