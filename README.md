# Staff Scheduler - Simple Proof of Concept

A simple web application that demonstrates multiple users can access and add data to a shared database using Supabase and React.

## Features

- **User Authentication**: Sign up and sign in functionality
- **Employee Management**: Add and view employee data
- **Multi-user Access**: Multiple users can access the same application and data
- **Real-time Updates**: Data changes are reflected immediately

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **Deployment**: Netlify
- **Styling**: Inline CSS (keeping it simple for POC)

## Local Development

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Set up Database**:
   Follow instructions in `database-setup.md`

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Browser**:
   Visit `http://localhost:5173`

## Testing Multi-user Access

1. Open the app in one browser
2. Sign up with your email address
3. Add some employee data
4. Open the app in a different browser (or incognito mode)
5. Sign up with a different email address
6. You should see the same employee data
7. Add more data from the second user
8. Refresh the first browser - you should see the new data

## Deployment

See `deployment-guide.md` for detailed deployment instructions to Netlify.

## What This Proves

✅ Multiple users can access the same application  
✅ Users can authenticate independently  
✅ Both users can add data to the shared database  
✅ Data persists and is visible to all authenticated users  
✅ The app works on any device with internet access  

## Next Steps

Once this simple version works, you can expand with:
- User roles and permissions
- Schedule management features
- Time-off request system
- Calendar integration
- Better UI/UX design
- Email notifications+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
