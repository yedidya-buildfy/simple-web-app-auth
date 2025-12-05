# Invoices3 - Supabase Authentication App

A modern web application with Supabase authentication built with React, TypeScript, and Tailwind CSS.

## Features

- User Login
- User Sign Up with email verification
- Forgot Password / Password Reset
- Protected Dashboard
- Clean UI with Tailwind CSS
- Heroicons for icons

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your Supabase credentials in `.env`:
   - `VITE_SUPABASE_URL`: Your Supabase project URL (found in Project Settings > API)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key (found in Project Settings > API)

### 3. Enable Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Providers
3. Enable Email provider
4. Configure email templates if needed

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Routes

- `/` - Redirects to login
- `/login` - User login page
- `/signup` - User registration page
- `/forgot-password` - Password reset request page
- `/dashboard` - Protected dashboard (requires authentication)

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Supabase** - Authentication and backend
- **Heroicons** - Icon library

## Project Structure

```
src/
├── lib/
│   └── supabase.ts       # Supabase client configuration
├── pages/
│   ├── Login.tsx         # Login page
│   ├── SignUp.tsx        # Sign up page
│   ├── ForgotPassword.tsx # Password reset page
│   └── Dashboard.tsx     # Protected dashboard
├── App.tsx               # Main app with routing
└── main.tsx              # Entry point
```

## Production Deployment

Before deploying to production:

1. Set environment variables in your hosting platform
2. Build the project: `npm run build`
3. Deploy the `dist` folder

## Security Notes

- Never commit `.env` file to version control
- The anon key is safe to use in the frontend (it's public)
- Supabase Row Level Security (RLS) policies should be configured for database access
