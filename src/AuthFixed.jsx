import { useState } from 'react'
import { supabase } from './supabase'
import PasswordReset from './PasswordReset'

function Auth({ onAuth }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    console.log('Attempting sign in with:', { email })

    try {
      const result = await supabase.auth.signInWithPassword({ email, password })

      const { data, error } = result
      console.log('Auth response:', { data, error })

      if (error) {
        setMessage(`Error: ${error.message}`)
        console.error('Auth error:', error)
      } else if (data.user) {
        setMessage('Success!')
        if (onAuth) onAuth(data.user)
      } else {
        setMessage('Authentication failed - no user returned')
      }
    } catch (err) {
      console.error('Catch error:', err)
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      {showPasswordReset ? (
        <>
          <PasswordReset onBack={() => setShowPasswordReset(false)} />
        </>
      ) : (
        <>
          <h2>Sign In</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Enter your email and password to access the Staff Scheduler.
          </p>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', margin: '1.5rem 0', fontSize: '0.9rem' }}>
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              style={{ background: 'none', border: 'none', color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Forgot Password?
            </button>
          </p>

          {message && (
            <div style={{
              padding: '0.75rem',
              marginTop: '1rem',
              borderRadius: '4px',
              backgroundColor: message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('Error') ? '#c33' : '#363',
              border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`
            }}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Auth