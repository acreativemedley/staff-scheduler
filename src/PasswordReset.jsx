import { useState } from 'react';
import { supabase } from './supabase';
import { theme } from './theme';

export default function PasswordReset({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Get the current URL origin (works for both localhost and Netlify)
      const redirectTo = `${window.location.origin}/update-password`;
      
      console.log('Sending password reset to:', email);
      console.log('Redirect URL:', redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        console.error('Password reset error:', error);
        setError(error.message);
      } else {
        setMessage('Password reset email sent! Please check your inbox.');
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: theme.cardBg,
      borderRadius: '8px',
      border: `1px solid ${theme.border}`
    }}>
      <h2 style={{ marginBottom: '1rem', color: theme.textPrimary }}>Reset Password</h2>
      <p style={{ marginBottom: '1.5rem', color: theme.textSecondary, fontSize: '14px' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handlePasswordReset}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: theme.labelColor
          }}>
            Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: `1px solid ${theme.inputBorder}`,
              backgroundColor: theme.inputBg,
              color: theme.textPrimary,
              fontSize: '14px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? theme.buttonDisabled : theme.primary,
            color: theme.white,
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'transparent',
            color: theme.primary,
            border: `1px solid ${theme.primary}`,
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back to Sign In
        </button>
      )}

      {message && (
        <div style={{
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '4px',
          backgroundColor: theme.successBg,
          color: theme.successText,
          border: `1px solid ${theme.successBorder}`,
          fontSize: '14px'
        }}>
          ✓ {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '4px',
          backgroundColor: theme.dangerBg,
          color: theme.dangerText,
          border: `1px solid ${theme.dangerBorder}`,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
