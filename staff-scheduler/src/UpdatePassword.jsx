import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { theme } from './theme';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Invalid or expired password reset link. Please request a new one.');
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        // Provide more user-friendly error messages
        if (error.message.includes('same')) {
          setError('New password must be different from your current password. Please choose a different password.');
        } else if (error.message.includes('weak')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else {
          setError(error.message);
        }
      } else {
        setMessage('Password updated successfully! Redirecting to login...');
        setPassword('');
        setConfirmPassword('');
        
        // Wait 2 seconds then redirect to home/login
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && error) {
    return (
      <div style={{
        maxWidth: '400px',
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: theme.cardBg,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ marginBottom: '1rem', color: theme.textPrimary }}>Invalid Link</h2>
        <p style={{ color: theme.textSecondary, marginBottom: '1.5rem' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.primary,
            color: theme.white,
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: theme.cardBg,
      borderRadius: '8px',
      border: `1px solid ${theme.border}`
    }}>
      <h2 style={{ marginBottom: '1rem', color: theme.textPrimary }}>Update Password</h2>
      <p style={{ marginBottom: '1.5rem', color: theme.textSecondary, fontSize: '14px' }}>
        Enter your new password below.
      </p>

      <form onSubmit={handleUpdatePassword}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: theme.labelColor
          }}>
            New Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter new password"
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: theme.labelColor
          }}>
            Confirm Password:
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Confirm new password"
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
          disabled={loading || !isValidSession}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading || !isValidSession ? theme.buttonDisabled : theme.primary,
            color: theme.white,
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading || !isValidSession ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {message && (
        <div style={{
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '4px',
          backgroundColor: theme.successBg,
          color: theme.successText,
          border: `1px solid ${theme.successBorder}`,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ✓ {message}
        </div>
      )}

      {error && !isValidSession === false && (
        <div style={{
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '4px',
          backgroundColor: theme.dangerBg,
          color: theme.dangerText,
          border: `1px solid ${theme.dangerBorder}`,
          fontSize: '14px',
          fontWeight: '500',
          lineHeight: '1.5'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        backgroundColor: theme.infoBg,
        borderRadius: '4px',
        fontSize: '12px',
        color: theme.textSecondary
      }}>
        💡 Password must be at least 6 characters long
      </div>
    </div>
  );
}
