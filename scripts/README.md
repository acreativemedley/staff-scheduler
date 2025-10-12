Local test for create-user serverless function

This repository includes a small script to run the Netlify serverless `create-user` handler locally without deploying to Netlify. It will call the handler directly using your local environment variables.

Setup (PowerShell):

```powershell
$env:SUPABASE_URL = 'https://your-project.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = 'your_service_role_key'
node --version  # ensure you have Node >= 18 for ESM support
npm install    # install dependencies if not already done
node ./scripts/run-create-user-test.mjs
```

Notes:
- This will create a real user in your Supabase project using the service role key. Clean up any test users in Supabase Auth if needed.
- Do NOT commit your service role key to source control.
- This approach avoids Netlify deployments and uses your local environment to verify the server-side behavior.
