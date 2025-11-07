# Quick Start Guide

Get your AIClass frontend up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Backend API running at `http://localhost:8080`
- Supabase project set up

## Steps

### 1. Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your credentials
# - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 4. Login

Navigate to `http://localhost:3000` and you'll be redirected to the login page.

**Test Credentials:**
- Teacher: `teacher@university.edu` / `password123`
- Student: `student@test.com` / `password123`

## What's Next?

After logging in, you'll see your dashboard based on your role:

### Teacher View
- Create new classes
- Add students to roster
- Enter and manage grades in the gradebook
- View AI recommendations

### Student View
- View enrolled classes
- Check grades and performance
- View AI recommendations

## Troubleshooting

**Issue: "Failed to load classes"**
- Ensure backend API is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

**Issue: "Login failed"**
- Verify Supabase credentials
- Check browser console for detailed errors
- Ensure user exists in Supabase Auth

**Issue: Build errors**
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

## File Structure Overview

```
src/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/
│   ├── api/               # API client modules
│   ├── auth/              # Authentication
│   ├── hooks/             # React hooks
│   └── stores/            # State management
└── types/                 # TypeScript types
```

## Key Features to Explore

1. **Dashboard**: Role-based home page
2. **Class Management**: Create and view classes
3. **Gradebook**: Interactive grade entry (teachers)
4. **Grade View**: Personal performance tracking (students)
5. **AI Assistant**: Click the floating chat button (bottom-right)
6. **Profile**: Update your information

## API Endpoints Used

- `/api/v1/users` - User management
- `/api/v1/classes` - Class operations
- `/api/v1/enrollments` - Student enrollments
- `/api/v1/grades` - Grade management
- `/api/v1/subjects` - Subject catalog
- `/api/v1/recommendations` - AI recommendations

## Architecture Highlights

- **Authentication**: Supabase Auth + JWT tokens
- **State Management**: Zustand (client) + TanStack Query (server)
- **UI Components**: Radix UI Themes
- **Styling**: Tailwind CSS v4
- **Type Safety**: TypeScript strict mode

For more detailed information, see [README.md](./README.md)

