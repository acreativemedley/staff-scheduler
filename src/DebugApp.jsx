import { supabase } from './supabase'

function App() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Debug Info</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>Environment Variables:</h3>
        <p><strong>URL:</strong> {supabaseUrl || 'MISSING'}</p>
        <p><strong>Key:</strong> {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'}</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3>Supabase Client:</h3>
        <p><strong>Client exists:</strong> {supabase ? 'Yes' : 'No'}</p>
        <p><strong>Client type:</strong> {typeof supabase}</p>
      </div>

      <button 
        onClick={async () => {
          try {
            console.log('Testing auth...')
            const { data, error } = await supabase.auth.getSession()
            console.log('Auth result:', data, error)
            alert(`Auth test: ${error ? 'Error: ' + error.message : 'Success'}`)
          } catch (err) {
            console.error('Auth test failed:', err)
            alert('Auth test failed: ' + err.message)
          }
        }}
        style={{ padding: '1rem', fontSize: '16px' }}
      >
        Test Auth
      </button>
    </div>
  )
}

export default App