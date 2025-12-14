# API Client - Desktop App

A modern desktop API client similar to Postman and Insomnia, built with Electron, React, and TypeScript.

## Features

- 🚀 Make HTTP requests (GET, POST, PUT, PATCH, DELETE, etc.)
- 📝 Request builder with query parameters, headers, and body
- 📊 Response viewer with formatted JSON and headers
- 📚 Request history with cloud sync (stored in Supabase)
- 🎨 Modern, dark-themed UI
- 💾 Collections support (coming soon)
- 🔐 User authentication with Supabase (Login/Signup)
- ☁️ Automatic history sync when logged in

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase authentication and database:
   - Create a new project at [Supabase](https://app.supabase.com)
   - Go to Project Settings > API
   - Copy the "Project URL" and "anon public" key
   - Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   - Set up the database table for request history:
     - Go to the SQL Editor in your Supabase dashboard
     - Run the SQL from `supabase_migration.sql` to create the `request_history` table
     - This will enable storing and syncing your request history across devices

3. Start the development server:
```bash
npm run dev
```

This will start both the Vite dev server and Electron app.

### Building

To build the app for production:

```bash
npm run build
```

## Usage

1. Enter a URL in the request builder
2. Select an HTTP method (GET, POST, etc.)
3. Add query parameters, headers, or body as needed
4. Click "Send" to make the request
5. View the response in the response viewer below

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Lucide React** - Icons
- **Supabase** - Authentication and backend services

## License

MIT

