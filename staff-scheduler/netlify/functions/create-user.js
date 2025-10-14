import { createClient } from '@supabase/supabase-js'

// Netlify function to create a user (server-side). Requires env vars:
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { email, password, user_role = 'staff', full_name = '', employee_id = null } = body

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email and password are required' }) }
    }

    // Create auth user with service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('Admin createUser error:', authError)
      return { statusCode: 400, body: JSON.stringify({ error: authError.message || authError }) }
    }

    const userId = authData.user?.id

    // Insert profile using service role
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        user_role,
        full_name,
        employee_id,
        is_active: true
      })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      // attempt to delete created auth user to avoid orphan
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (delErr) {
        console.error('Failed to delete orphaned auth user:', delErr)
      }
      return { statusCode: 400, body: JSON.stringify({ error: profileError.message || profileError }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, userId }) }
  } catch (err) {
    console.error('create-user handler error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
