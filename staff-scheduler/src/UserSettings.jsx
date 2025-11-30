import { useState } from 'react'
import { supabase } from './supabase'
import { theme } from './theme'

export default function UserSettings({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('password') // 'password' or 'account'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Validate password is different
    if (currentPassword === newPassword) {
      setMessage('New password must be different from current password')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      // First, verify current password by attempting to re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        setMessage('Current password is incorrect')
        setMessageType('error')
        setLoading(false)
        return
      }

      // If re-auth successful, update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        // Provide user-friendly error messages
        if (updateError.message.includes('same')) {
          setMessage('New password must be different from your current password')
        } else if (updateError.message.includes('weak')) {
          setMessage('Password is too weak. Please choose a stronger password')
        } else {
          setMessage(updateError.message)
        }
        setMessageType('error')
      } else {
        setMessage('✓ Password changed successfully!')
        setMessageType('success')
        // Clear form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage(err.message || 'An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPasswordReset = async () => {
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const redirectTo = `${window.location.origin}/update-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectTo,
      })

      if (error) {
        console.error('Password reset error:', error)
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('✓ Password reset email sent! Please check your inbox.')
        setMessageType('success')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage(err.message || 'An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: theme.textPrimary, marginBottom: '1.5rem' }}>Account Settings</h2>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: `2px solid ${theme.border}` }}>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'password' ? theme.primary : 'transparent',
            color: activeTab === 'password' ? 'white' : theme.textPrimary,
            border: 'none',
            borderBottom: activeTab === 'password' ? `3px solid ${theme.primary}` : 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'password' ? 'bold' : 'normal'
          }}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'account' ? theme.primary : 'transparent',
            color: activeTab === 'account' ? 'white' : theme.textPrimary,
            border: 'none',
            borderBottom: activeTab === 'account' ? `3px solid ${theme.primary}` : 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'account' ? 'bold' : 'normal'
          }}
        >
          Account Info
        </button>
      </div>

      {/* Password Change Tab */}
      {activeTab === 'password' && (
        <div>
          <h3 style={{ color: theme.textPrimary, marginBottom: '1rem' }}>Change Your Password</h3>
          
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <p style={{ color: theme.textSecondary, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              💡 <strong>Tip:</strong> You can also use the "Forgot Password?" option during login to receive a password reset email.
            </p>
            <button
              onClick={handleSendPasswordReset}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>

          <p style={{ color: theme.textSecondary, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Or enter your current password below to change it directly:
          </p>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.labelColor,
                fontSize: '0.95rem'
              }}>
                Current Password:
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter your current password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.labelColor,
                fontSize: '0.95rem'
              }}>
                New Password:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.labelColor,
                fontSize: '0.95rem'
              }}>
                Confirm New Password:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? theme.buttonDisabled : theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '4px', border: '1px solid #fde68a', fontSize: '0.9rem', color: '#92400e' }}>
            ℹ️ Password must be at least 6 characters long and different from your current password.
          </div>
        </div>
      )}

      {/* Account Info Tab */}
      {activeTab === 'account' && (
        <div>
          <h3 style={{ color: theme.textPrimary, marginBottom: '1rem' }}>Account Information</h3>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: theme.cardBg, 
            borderRadius: '8px', 
            border: `1px solid ${theme.border}`,
            marginBottom: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Email Address</p>
              <p style={{ color: theme.textPrimary, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {user?.email || 'Not available'}
              </p>
            </div>

            {userProfile?.full_name && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Full Name</p>
                <p style={{ color: theme.textPrimary, fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {userProfile.full_name}
                </p>
              </div>
            )}

            {userProfile?.user_role && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Role</p>
                <p style={{ 
                  color: theme.textPrimary, 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}>
                  {userProfile.user_role}
                </p>
              </div>
            )}

            {user?.user_metadata?.created_at && (
              <div>
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Account Created</p>
                <p style={{ color: theme.textPrimary, fontSize: '1.1rem' }}>
                  {new Date(user.user_metadata.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <h4 style={{ color: theme.textPrimary, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Need to update your information?</h4>
            <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '1rem' }}>
              To change your name or other profile information, please contact your system administrator.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div style={{
          padding: '1rem',
          marginTop: '1.5rem',
          borderRadius: '4px',
          backgroundColor: messageType === 'success' ? theme.successBg : theme.dangerBg,
          color: messageType === 'success' ? theme.successText : theme.dangerText,
          border: `1px solid ${messageType === 'success' ? theme.successBorder : theme.dangerBorder}`,
          fontSize: '0.95rem'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
