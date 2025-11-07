# AIClass Frontend - Student Performance Management System

A modern, corporate-grade front-end application built with Next.js 16, React 19, TypeScript, Zustand, TanStack Query, and Radix UI.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (Strict Mode)
- **State Management**: Zustand (Client State) + TanStack Query v5 (Server State)
- **UI Components**: Radix UI Themes
- **Styling**: Tailwind CSS v4
- **API Client**: Axios with interceptors
- **Authentication**: Supabase Auth + JWT

## 📋 Features

### Role-Based Architecture
- **Teacher Role**:
  - Create and manage classes
  - Enter and edit grades via interactive gradebook
  - Manage student enrollment (roster)
  - View AI-powered teaching recommendations
  
- **Student Role**:
  - View enrolled classes
  - Track personal grades and performance
  - View AI-powered learning recommendations

### Key Components
- **Global AI Assistant**: Persistent chat bubble with real-time recommendations
- **Interactive Gradebook**: Spreadsheet-like interface for grade entry
- **Dashboard**: Role-based views with class management
- **Profile Management**: Update user information
- **Authentication**: Secure login with Supabase

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8080`
- Supabase account and project

### 1. Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your values:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
aiclass-frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing page (redirects)
│   │   ├── login/               # Authentication
│   │   ├── dashboard/           # Role-based dashboard
│   │   ├── class/
│   │   │   ├── new/            # Create class (teacher)
│   │   │   └── [classId]/      # Class detail (role-based)
│   │   │       └── roster/     # Roster management (teacher)
│   │   └── profile/            # User profile
│   │
│   ├── components/              # React components
│   │   ├── GlobalAIAssistant.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherClassView.tsx  # Gradebook
│   │   ├── StudentClassView.tsx  # Grade view
│   │   └── ClassCard.tsx
│   │
│   ├── lib/
│   │   ├── api/                # API client modules
│   │   │   ├── client.ts       # Axios instance
│   │   │   ├── users.ts
│   │   │   ├── classes.ts
│   │   │   ├── grades.ts
│   │   │   ├── enrollments.ts
│   │   │   └── recommendations.ts
│   │   │
│   │   ├── auth/               # Authentication utilities
│   │   │   ├── supabase.ts
│   │   │   └── auth-utils.ts
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-classes.ts
│   │   │   ├── use-grades.ts
│   │   │   └── use-recommendations.ts
│   │   │
│   │   └── stores/             # Zustand stores
│   │       └── auth-store.ts
│   │
│   └── types/
│       └── api.ts              # TypeScript type definitions
│
├── middleware.ts               # Next.js middleware
└── package.json
```

## 🔐 Authentication Flow

1. User enters credentials on `/login`
2. Supabase validates and returns JWT token
3. Token stored in localStorage
4. Backend API called to fetch user profile
5. User data stored in Zustand store
6. Axios interceptor adds token to all API requests

## 🎨 UI/UX Highlights

- **Radix UI Themes**: Accessible, customizable components
- **Responsive Design**: Mobile-first approach
- **Loading States**: Spinners and skeletons for better UX
- **Error Handling**: User-friendly error messages
- **Optimistic Updates**: Instant feedback on grade entry

## 📊 State Management Strategy

### Client State (Zustand)
- Authentication state (user, token, role)
- Global UI state

### Server State (TanStack Query)
- API data (classes, grades, enrollments, recommendations)
- Automatic caching and invalidation
- Optimistic updates for mutations
- Background refetching

## 🔧 API Integration

All API endpoints use the `/api/v1/*` prefix with Bearer token authentication:

- **Users**: `/api/v1/users`
- **Subjects**: `/api/v1/subjects`
- **Classes**: `/api/v1/classes`
- **Enrollments**: `/api/v1/enrollments`
- **Grades**: `/api/v1/grades`
- **Recommendations**: `/api/v1/recommendations`

## 🧪 Testing Credentials

Use the following test accounts (if set up in your backend):

**Teacher:**
- Email: `teacher@university.edu`
- Password: `password123`

**Student:**
- Email: `student@test.com`
- Password: `password123`

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📦 Key Dependencies

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "@radix-ui/themes": "^3.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^5.0.0",
  "axios": "^1.0.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

## 🏗️ Corporate Standards Applied

- ✅ Full TypeScript coverage with strict mode
- ✅ Centralized API client with error handling
- ✅ Clear separation of concerns (client vs server state)
- ✅ Feature-based code organization
- ✅ Role-based access control
- ✅ JWT authentication with auto-refresh
- ✅ Performance optimizations (caching, lazy loading)
- ✅ Maintainable and scalable architecture

## 🐛 Troubleshooting

### Authentication Issues
- Verify Supabase credentials in `.env.local`
- Check browser console for JWT token
- Ensure backend API is running

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check backend is running on specified port
- Check browser network tab for failed requests

### Build Issues
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📝 License

This project is part of the AIClass Student Performance Management System.

## 👥 Support

For issues or questions, please contact the development team.
