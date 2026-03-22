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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Database Migration
Apply every SQL file in `/supabase/migrations/` in numeric order. The current app expects the full schema and RPC contract through `013_canonical_pairing_messaging.sql`, not just the initial schema.

Minimum required messaging migrations:
1. `007_rebuild_messaging.sql`
2. `008_allow_pending_pairing_delete.sql`
3. `009_fix_pairing_conversation_resolution.sql`
4. `010_stabilize_pairing_messaging.sql`
5. `011_fix_pairing_conversation_ambiguity.sql`
6. `012_repair_pairing_conversation_resolution.sql`
7. `013_canonical_pairing_messaging.sql`

After applying migrations, run the verification helpers in `/supabase/sql/`:
1. `verify_messaging_contract.sql` - Checks the expected messaging columns, functions, policies, and indexes.
2. `audit_pairing_messaging_readiness.sql` - Finds pairings blocked by missing `clerk_user_id` data.
3. `repair_pairing_conversation_members.sql` - Rebuilds canonical conversation membership after data backfills.

### 4. Clerk JWT Template Integration
To allow Clerk to communicate with Supabase:
1. Go to your **Clerk Dashboard** -> JWT Templates.
2. Create a new "Supabase" template.
3. Ensure the **Signing Algorithm** is set to `HS256`.
4. Enter your exact **Supabase JWT Secret** into the **Signing Key** field.
5. Keep the template name as `supabase`, because the frontend requests `session.getToken({ template: 'supabase' })`.
6. Verify that the JWT payload `sub` matches the signed-in Clerk user ID. Messaging RPCs and RLS policies rely on `auth.jwt()->>'sub'`.

### 5. Start the Development Server
```bash
npm run dev
```
The development script in this repo runs at `http://localhost:3000`.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
