import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

function DatabaseTest() {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runTests()
  }, [])

  async function runTests() {
    const results = {}
    
    try {
      // Test 1: Check auth user
      console.log('Testing auth user...')
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      results.auth = { user: authUser?.user?.email, error: authError?.message }
      console.log('Auth result:', results.auth)

      // Test 2: Check employees table
      console.log('Testing employees table...')
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .limit(5)
      results.employees = { 
        count: employees?.length || 0, 
        error: empError?.message,
        data: employees 
      }
      console.log('Employees result:', results.employees)

      // Test 3: Check user_profiles table
      console.log('Testing user_profiles table...')
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5)
      results.profiles = { 
        count: profiles?.length || 0, 
        error: profileError?.message,
        data: profiles 
      }
      console.log('Profiles result:', results.profiles)

      // Test 4: Check RLS status
      console.log('Testing RLS policies...')
      const { data: rlsInfo, error: rlsError } = await supabase
        .rpc('check_rls_status')
      results.rls = { data: rlsInfo, error: rlsError?.message }
      console.log('RLS result:', results.rls)

    } catch (error) {
      console.error('Test error:', error)
      results.error = error.message
    }

    setTestResults(results)
    setLoading(false)
  }

  if (loading) {
    return <div>Running database tests...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Database Test Results</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Authentication:</h4>
        <pre>{JSON.stringify(testResults.auth, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Employees Table:</h4>
        <pre>{JSON.stringify(testResults.employees, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>User Profiles Table:</h4>
        <pre>{JSON.stringify(testResults.profiles, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>RLS Status:</h4>
        <pre>{JSON.stringify(testResults.rls, null, 2)}</pre>
      </div>

      <button onClick={runTests} style={{ padding: '10px 20px' }}>
        Run Tests Again
      </button>
    </div>
  )
}

export default DatabaseTest