# 🐄 PashuRaksha — Livestock Disease Surveillance Platform
> Smart India Hackathon 2026 | Problem Statement 26128

A real-time disease outbreak surveillance and reporting system for Indian livestock farmers and veterinary officials. Built with React, Node.js, and Supabase.

---

## 📋 Features

- **Disease Outbreak Map** — Real-time geospatial surveillance across all 36 Indian States & UTs
- **AI-Powered Report Submission** — Farmers can report symptoms via text or voice recording
- **Herd Management** — Track animals, vaccination schedules, and health status
- **Epidemiological Trends** — Charts for incidence, mortality, pathogen distribution, and vaccination coverage
- **Multilingual Support** — English, Hindi, and Marathi
- **GPS Integration** — Automatic location detection and proximity alerts

---

## 🏗️ Project Structure

```
SIH_26128/
├── frontend/          # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/   # UI components (Dashboard, Trends, Herd, etc.)
│   │   ├── lib/          # Supabase client, utilities
│   │   ├── i18n/         # Language translations (EN/HI/MR)
│   │   └── App.tsx       # Routes and auth
│   ├── .env.local        # 🔒 Your Supabase credentials (not committed)
│   └── .env.example      # Template for required env vars
│
├── backend/           # Node.js + Express backend (mock OTP auth)
│   └── src/index.ts
│
├── supabase/          # Supabase configuration
│   └── migrations/
│       └── 20260901_initial_schema.sql   # DB schema: profiles, animals, reports
│
├── .gitignore         # Root-level gitignore (covers all sub-projects)
└── README.md          # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/SIH_26128.git
cd SIH_26128
```

### 2. Set up the database
Run the migration in your Supabase project's **SQL Editor**:
```
supabase/migrations/20260901_initial_schema.sql
```
This creates the `profiles`, `animals`, and `reports` tables with RLS policies.

### 3. Configure environment variables
```bash
cp frontend/.env.example frontend/.env.local
```
Fill in your Supabase URL and publishable key:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 4. Install and run the frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at **http://localhost:5173**

### 5. (Optional) Run the backend mock auth server
```bash
cd backend
npm install
npm run dev
```
Mock OTP server runs at **http://localhost:4000**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Vanilla CSS, CSS Variables |
| Charts | Recharts |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| Backend | Node.js, Express |
| Icons | Lucide React |
| i18n | Custom LanguageContext |

---

## 🔒 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase publishable/anon key |
| `VITE_AUTH_MODE` | Optional | Set to `mock` for local dev without Supabase |

---

## 📜 License

Built for Smart India Hackathon 2026. All rights reserved.
