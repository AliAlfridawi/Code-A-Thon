# 🎓 Academic Pairing Hub

<div align="center">
  <p>A modern, real-time platform designed to intelligently pair academic mentors and mentees, manage professional relationships, and foster communication.</p>
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
</div>

---

## ✨ Key Features

- **🧠 Intelligent Profile Matching**: Dynamically calculates compatibility scores between mentors and mentees based on shared research interests, departments, and academic tags.
- **🛡️ Enterprise-Grade Security**: Fully protected by **Clerk** Authentication and highly strict **Supabase Row Level Security (RLS)**. API requests actively intercept and exchange Clerk session tokens for Supabase JWTs to guarantee absolute data ownership.
- **💬 Real-Time Messaging**: Built-in conversational interfaces powered by Supabase Realtime Websockets. Features instantaneous message delivery, online/offline presence tracking, and live typing indicators.
- **📊 Interactive Dashboard**: High-level aggregate statistics, live activity feeds, and comprehensive member directories.
- **✨ Beautiful & Fluid UI**: Professionally designed utilizing Tailwind CSS, Lucide Icons, and Motion for buttery-smooth page transitions and staggered entrance animations.

---

## 🏗️ Architecture & Tech Stack

The application strictly enforces a separation of concerns, heavily utilizing custom React Hooks (`useSupabase`, `useMessages`, `usePairings`) to abstract complex network calls and database subscriptions from the UI layer.

* **Frontend Framework**: React 18 / Vite
* **Type Checking**: Strict TypeScript
* **Database & Realtime Backend**: Supabase (PostgreSQL)
* **Authentication Provider**: Clerk

### Security Posture 🔒
* **No hardcoded secrets**: All API keys and environment variables are externalized.
* **Strict JWT Verification**: The Supabase client intercepts requests and passes the `clerkToken` in the `Authorization: Bearer` header. The custom SQL migrations validate every single `INSERT`, `UPDATE`, and `SELECT` query against `auth.jwt()->>'sub'` to ensure users can only ever access their own data.

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js 18+
* An active [Supabase](https://supabase.com) Project
* An active [Clerk](https://clerk.com) Application

### 1. Clone & Install
```bash
git clone https://github.com/your-username/academic-pairing-hub.git
cd academic-pairing-hub
npm install
```

### 2. Environment Setup
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Ensure you have the following populated:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Database Migration
In the Supabase SQL Editor, execute the two migration files found in `/supabase/migrations/`:
1. `001_initial_schema.sql` - Provisions the 8 tables, indexes, realtime publications, and mock seed data.
2. `002_strict_rls.sql` - Drops public policies and enforces strict Clerk JWT Row Level Security.

### 4. Clerk JWT Template Integration
To allow Clerk to communicate with Supabase:
1. Go to your **Clerk Dashboard** -> JWT Templates.
2. Create a new "Supabase" template.
3. Ensure the **Signing Algorithm** is set to `HS256`.
4. Enter your exact **Supabase JWT Secret** into the **Signing Key** field.

### 5. Start the Development Server
```bash
npm run dev
```
The application will be intensely fast and securely available at `http://localhost:5173`.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
