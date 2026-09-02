# 🐄 PashuRaksha — Livestock Disease Surveillance Platform
> Smart India Hackathon 2026 | Problem Statement 26128

A real-time disease outbreak surveillance and reporting system for Indian livestock farmers and veterinary officials. Combines AI-powered image analysis for disease detection with geospatial tracking and epidemiological monitoring. Built with React, Node.js, FastAPI, and Supabase.

---

## 📋 Features

- **AI-Powered Disease Detection** — Deep learning model (EfficientNetB0) analyzes livestock images for disease signs (Lumpy Skin Disease, other infections)
- **Disease Outbreak Map** — Real-time geospatial surveillance across all 36 Indian States & UTs
- **Smart Report Submission** — Farmers submit images + audio symptoms; backend integrates with ML API for diagnosis
- **Herd Management** — Track animals, vaccination schedules, and health status
- **Epidemiological Trends** — Charts for incidence, mortality, pathogen distribution, and vaccination coverage
- **Multilingual Support** — English, Hindi, and Marathi
- **GPS Integration** — Automatic location detection and proximity alerts

---

## 🏗️ Project Structure

```
SIH_26128/
├── frontend/                      # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/            # UI components (Dashboard, Trends, Herd, Login, etc.)
│   │   ├── lib/                   # Supabase client, utilities, auth
│   │   ├── i18n/                  # Language translations (EN/HI/MR)
│   │   └── App.tsx                # Routes and auth logic
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.local                 # 🔒 Your Supabase credentials (not committed)
│   └── .env.example               # Template for required env vars
│
├── backend/                       # Node.js + Express backend
│   ├── src/
│   │   └── index.ts               # ML proxy and health endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                       # Backend config (ML API URL)
│
├── livestock-disease-api-v2/      # 🤖 FastAPI ML Server (Disease Detection)
│   ├── app.py                     # FastAPI app with /predict endpoint
│   ├── best_livestock_model.keras # Pre-trained EfficientNetB0 model
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Docker configuration
│   └── .dockerignore
│
├── supabase/                      # Supabase configuration & migrations
│   ├── config.toml
│   └── migrations/
│       └── 20260901_initial_schema.sql   # DB schema: profiles, animals, reports
│
├── .gitignore                     # Root-level gitignore
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18
- **Python** >= 3.11 (for ML model)
- **Docker** (recommended for ML model, optional)
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/mayankbisht1212/SIH_26128.git
cd SIH_26128
```

### 2. Set up the database
Run the migration in your Supabase project's **SQL Editor**:
```sql
-- Copy contents of supabase/migrations/20260901_initial_schema.sql
```
This creates the `profiles`, `animals`, and `reports` tables with Row-Level Security (RLS) policies.

**📖 See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for detailed schema documentation.**

### 3. Configure environment variables

#### Frontend
```bash
cd frontend
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_API_URL=http://localhost:4000
```

#### Backend
```bash
cd backend
cp .env.example .env
```

### 4. Set up & run the ML Model API

#### Option A: Using Docker (Recommended)
```bash
cd livestock-disease-api-v2
docker build -t livestock-disease-api .
docker run --rm -p 5001:5000 livestock-disease-api
```

#### Option B: Local Python Environment
```bash
cd livestock-disease-api-v2
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 5001
```

ML API will be available at **http://localhost:5001**

Test it:
```bash
curl http://localhost:5001/health
# Should return: {"status": "healthy"}
```

### 5. Install and run the backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at **http://localhost:4000**

### 6. Install and run the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:5173**

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                   │
│                    http://localhost:5173                    │
│  • Dashboard, Trends, Herd Management, Report Form          │
│  • Multilingual UI (EN/HI/MR)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────────┐
│    Supabase      │        │  Backend (Node.js)   │
│  • PostgreSQL    │        │  http://localhost... │
│  • Auth & Rows   │        │  • Endpoints         │
│  • Storage       │        │  • ML Integration    │
└──────────────────┘        └──────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  ML API (FastAPI)    │
                        │ http://localhost:... │
                        │  • /predict endpoint │
                        │  • EfficientNetB0    │
                        │  • Disease Detection │
                        └──────────────────────┘
```

---

## 🔌 API Endpoints

### ML Model API (`livestock-disease-api-v2/`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | API status & model info |
| `/health` | GET | Health check |
| `/predict` | POST | Predict disease from image + audio (called only by the backend) |

**Request (POST /predict):**
```
Content-Type: multipart/form-data
- file: image file (JPEG/PNG)
- audio: audio file (MP3/WAV)
```

**Response:**
```json
{
  "success": true,
  "disease": "Lumpy_Skin",
  "confidence_percent": 95,
  "audio": { "received": true }
}
```

### Backend API (`backend/`)
| Endpoint | Purpose |
|---|---|
| `POST /api/ml/predict` | Accept image + audio and proxy them to the ML API |
| `GET /api/health` | Backend health check |

The frontend stores authenticated reports, media paths, and ML outputs in Supabase. The backend forwards only the media analysis request to the ML API.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Vanilla CSS, CSS Variables |
| **Charts** | Recharts |
| **Backend** | Node.js, Express, TypeScript |
| **ML Model** | FastAPI, TensorFlow/Keras, EfficientNetB0 |
| **Database** | Supabase (PostgreSQL + Row-Level Security) |
| **Deployment** | Docker (ML model), Vercel/Netlify (frontend) |
| **Containerization** | Docker, Docker Compose (optional) |

---

## 📦 Dependencies

### Frontend
- `react`: UI framework
- `recharts`: Charts for trends
- `@supabase/supabase-js`: Database & auth client
- `vite`: Build tool

### Backend
- `express`: Web framework
- `axios`: HTTP client (for ML API calls)
- `cors`: Cross-origin middleware
- `typescript`: Type safety

### ML Model
- `fastapi`: Web framework
- `tensorflow==2.21.0`: Deep learning
- `pillow`: Image processing
- `numpy`: Numerical computing
- `uvicorn`: ASGI server

---

## 🧪 Testing

### Test ML Model Locally
```bash
cd backend
npm run dev

# In another terminal, test the prediction endpoint
curl -X POST http://localhost:4000/api/ml/predict \
  -F "file=@path/to/image.jpg" \
  -F "audio=@path/to/audio.wav"
```

### Test Frontend
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
# Sign in with an OTP configured in Supabase Auth
```

---

## 🚢 Deployment

### Frontend
1. Build: `cd frontend && npm run build`
2. Deploy to **Vercel** or **Netlify**
3. Set environment variables in dashboard

### Backend
1. Build: `cd backend && npm run build`
2. Deploy to **Heroku**, **Railway**, or **Fly.io**

### ML Model
1. Docker image: `docker build -t livestock-disease-api .`
2. Push to **Docker Hub** or **AWS ECR**
3. Deploy to **AWS ECS**, **Google Cloud Run**, or **Railway**

---

## 📋 Development Workflow

1. **Feature branches:** Create branches from `main` (e.g., `feature/herd-management`)
2. **Testing:** Run tests before opening PRs
3. **Pull Requests:** Include description of changes
4. **Merge:** Squash and merge to keep history clean

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

This project is part of **Smart India Hackathon 2026** (Problem 26128).

---

## 📞 Support

For issues or questions:
1. Check **GitHub Issues**
2. Review existing documentation
3. Contact team members

---

## 🎯 Next Steps

- [ ] Integrate audio transcription for symptom analysis
- [ ] Expand ML model to more livestock diseases
- [ ] Add veterinary officer dashboard
- [ ] Real-time push notifications
- [ ] Mobile app (React Native)
- [ ] Integration with government livestock databases
| Icons | Lucide React |
| i18n | Custom LanguageContext |

---

## 🔒 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase publishable/anon key |
| `VITE_API_URL` | ✅ | Backend URL, e.g. `http://localhost:4000` |
| `ML_API_URL` | ✅ Backend only | ML API URL, e.g. `http://localhost:5001` |

---

## 📜 License

Built for Smart India Hackathon 2026. All rights reserved.
