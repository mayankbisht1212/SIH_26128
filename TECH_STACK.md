# 🛠️ Tech Stack Documentation

Comprehensive overview of all technologies, frameworks, and libraries used in PashuRaksha.

---

## 📋 Table of Contents

1. [Frontend Stack](#-frontend-stack)
2. [Backend Stack](#-backend-stack)
3. [ML/AI Stack](#-mlai-stack)
4. [Database & Storage](#-database--storage)
5. [DevOps & Infrastructure](#-devops--infrastructure)
6. [Development Tools](#-development-tools)
7. [Architecture Overview](#-architecture-overview)
8. [Technology Rationale](#-technology-rationale)

---

## 🎨 Frontend Stack

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **React** | `^19.2.8` | UI library with hooks and concurrent features |
| **React DOM** | `^19.2.8` | React rendering for web browsers |
| **React Router DOM** | `^7.18.3` | Client-side routing & navigation |
| **TypeScript** | `^7.0.2` | Static type checking & IntelliSense |

### UI & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| **Recharts** | `^3.10.1` | React charts for epidemiological trends/dashboards |
| **Leaflet** | `^1.9.4` | Open-source map library |
| **React Leaflet** | `^5.0.0` | React wrapper for Leaflet maps |
| **Lucide React** | `^1.37.0` | Beautiful SVG icon library |
| **React Select** | `^5.10.2` | Customizable dropdown/select component |

### Backend Integration
| Package | Version | Purpose |
|---------|---------|---------|
| **Supabase JS Client** | `^2.112.4` | PostgreSQL database + Auth client |

### Build & Development
| Package | Version | Purpose |
|---------|---------|---------|
| **Vite** | `^8.2.2` | Lightning-fast build tool & dev server |
| **@vitejs/plugin-react** | `^6.1.0` | Vite plugin for React Fast Refresh |
| **OxLint** | `^1.79.0` | Fast JavaScript linter (Rust-based) |

### Type Definitions
| Package | Version | Purpose |
|---------|---------|---------|
| **@types/react** | `^19.2.18` | TypeScript definitions for React |
| **@types/react-dom** | `^19.2.4` | TypeScript definitions for React DOM |

**Frontend Architecture:**
```
src/
├── components/          # Reusable UI components
│   ├── Dashboard.tsx    # Disease surveillance map
│   ├── Trends.tsx       # Charts for epidemiology
│   ├── MyHerd.tsx       # Livestock management
│   ├── ReportForm.tsx   # Image/audio report submission
│   ├── Advisories.tsx   # Alert notifications
│   ├── Login.tsx        # Auth UI
│   └── ...
├── lib/                 # Utilities & services
│   ├── supabase.ts      # Supabase client instance
│   ├── database.types.ts # Auto-generated TypeScript types
│   ├── dateUtils.ts     # Date/time helpers
│   └── mockAuth.ts      # Mock authentication
├── i18n/                # Internationalization
│   ├── LanguageContext.tsx  # Language state management
│   └── translations.ts      # EN/HI/MR translations
├── App.tsx              # Routes & layout
└── main.tsx             # Entry point
```

---

## 🔙 Backend Stack

### Runtime & Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **Node.js** | `^18.0.0` | JavaScript runtime |
| **Express** | `^5.2.1` | Web framework for routing & middleware |
| **TypeScript** | `^7.0.2` | Static type checking |

### Middleware & Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| **CORS** | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| **Axios** | `^1.20.0` | HTTP client for calling ML API |
| **Multer** | `^2.3.0` | Middleware for file uploads (images, audio) |

### Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| **TSX** | `^4.23.13` | TypeScript execution with watch mode |
| **@types/node** | `^26.4.0` | TypeScript definitions for Node.js |
| **@types/express** | `^5.0.6` | TypeScript definitions for Express |
| **@types/cors** | `^2.8.19` | TypeScript definitions for CORS |
| **@types/multer** | `^2.2.0` | TypeScript definitions for Multer |

**Backend Architecture:**
```
src/
├── index.ts             # Main server entry point
├── routes/
│   ├── callMLmodel.ts   # /api/predict endpoint
│   ├── reports.ts       # /api/reports CRUD
│   └── ...
├── middleware/
│   ├── auth.ts          # Authentication checks
│   └── errorHandler.ts  # Global error handling
└── services/
    ├── mlService.ts     # ML API integration
    └── supabaseService.ts # Database interactions
```

**Key Endpoints:**
- `POST /api/reports` — Submit disease report with image + audio
- `GET /api/reports` — Fetch reports (filtered by location/date)
- `POST /api/predict` — Forward to ML model & return prediction

---

## 🤖 ML/AI Stack

### Framework & Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| **FastAPI** | Latest | Modern Python web framework for API |
| **Python** | `^3.11` | Core language |
| **Uvicorn** | Latest | ASGI server for async Python apps |

### Deep Learning
| Package | Version | Purpose |
|---------|---------|---------|
| **TensorFlow** | `==2.21.0` | Machine learning framework |
| **Keras** | (via TensorFlow) | High-level neural networks API |

### Image Processing
| Package | Version | Purpose |
|---------|---------|---------|
| **Pillow** | Latest | Image manipulation & loading |
| **NumPy** | Latest | Numerical computing |

### Model Architecture
- **Base Model:** EfficientNetB0
- **Input Size:** 224×224 pixels
- **Classes:** `Healthy`, `Lumpy_Skin`, `Other_Infections`
- **Output:** Prediction + confidence score (0-1)
- **Format:** Keras `.keras` file

**ML API Endpoints:**
```
GET  /                  # Model info & class names
GET  /health            # Health check
POST /predict           # Disease detection
  ├── Input: image file (JPEG/PNG)
  ├── Input: audio file (MP3/WAV)
  └── Output: {prediction, confidence, classes}
```

**ML API Architecture:**
```python
livestock-disease-api-v2/
├── app.py                       # FastAPI application
├── best_livestock_model.keras   # Pre-trained model weights
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container configuration
└── .dockerignore
```

**Deployment:**
```bash
# Local development
python -m uvicorn app:app --host 0.0.0.0 --port 5000

# Docker
docker build -t livestock-disease-api .
docker run -p 5000:5000 livestock-disease-api
```

---

## 💾 Database & Storage

### Database System
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Relational database (hosted on Supabase) |
| **Row-Level Security** | Fine-grained access control |
| **Triggers & Functions** | Auto-populate profiles on user signup |

### Supabase Services
| Service | Purpose |
|---|---|
| **Auth** | Multi-provider authentication (Email, Google, etc.) |
| **Database** | PostgreSQL with RLS |
| **Real-time** | Live subscriptions to table changes |
| **Vector Store** | Optional: Vectorize embeddings (future) |

### Schema
**3 Main Tables:**
1. **profiles** — User data (farmers, veterinarians)
2. **animals** — Livestock inventory with health tracking
3. **reports** — Disease outbreak reports with geospatial data

**Migration Management:**
```
supabase/
└── migrations/
    ├── 20260901_initial_schema.sql      # Core tables
    └── 20260902_ml_report_media.sql     # ML results tracking
```

### Type Safety
- **Auto-generated TypeScript types** from Supabase schema
- File: `frontend/src/lib/database.types.ts`
- Regenerate with: `supabase gen types typescript ...`

---

## 🚀 DevOps & Infrastructure

### Containerization
| Technology | Purpose |
|---|---|
| **Docker** | Container runtime for ML model & services |
| **Docker Compose** | Multi-container orchestration (optional) |

### Version Control
| Technology | Purpose |
|---|---|
| **Git** | Source code management |
| **GitHub** | Repository hosting & collaboration |

### Deployment Platforms (Recommended)
| Component | Platform Options |
|---|---|
| **Frontend** | Vercel, Netlify, AWS S3 + CloudFront |
| **Backend** | Heroku, Railway, Fly.io, AWS Lambda |
| **ML Model** | AWS ECR + ECS, Google Cloud Run, Railway, Docker Hub |
| **Database** | Supabase (managed PostgreSQL) |

### CI/CD (Future)
- GitHub Actions for automated testing & deployment
- Automated Docker image builds

---

## 🛠️ Development Tools

### Build Tools
| Tool | Purpose |
|---|---|
| **TypeScript** | Static type checking for JS |
| **Vite** | Fast bundler & dev server |
| **TSX** | TypeScript executor for Node.js |

### Linting & Code Quality
| Tool | Purpose |
|---|---|
| **OxLint** | Fast Rust-based JavaScript linter |
| **tsc --noEmit** | Type checking (no output) |

### Package Managers
| Tool | Purpose |
|---|---|
| **npm** | Node.js package manager (frontend & backend) |
| **pip** | Python package manager (ML model) |

### Development Environment
| Tool | Purpose |
|---|---|
| **VSCode** | Code editor |
| **Node 18+** | Required runtime |
| **Python 3.11** | Required for ML model |

---

## 🏗️ Architecture Overview

### Microservices-Inspired Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                 │
│                 (Browser / React App)                           │
│  • React 19 with TypeScript                                     │
│  • Vite development server                                      │
│  • Recharts, Leaflet for visualization                          │
│  • Multilingual (EN/HI/MR) via i18n Context                    │
└────────────┬────────────────────────────────────────┬───────────┘
             │                                        │
             ▼                                        ▼
    ┌──────────────────────┐            ┌──────────────────────┐
    │   Backend API Layer  │            │  Database Layer      │
    │   (Express + Node)   │            │  (Supabase)          │
    │                      │            │                      │
    │ • REST Endpoints     │───────────▶│ • PostgreSQL         │
    │ • File Upload (Multer) │          │ • Row-Level Security │
    │ • CORS Middleware    │            │ • Auth Management    │
    │ • Error Handling     │            │                      │
    └──────────┬───────────┘            └──────────────────────┘
               │
               │ HTTP (Axios)
               ▼
    ┌──────────────────────┐
    │  ML Model Layer      │
    │  (FastAPI + Python)  │
    │                      │
    │ • Disease Detection  │
    │ • Image Analysis     │
    │ • Confidence Scoring │
    │ • EfficientNetB0 DL  │
    └──────────────────────┘
```

### Data Flow

```
1. Farmer submits report
   ↓
2. Frontend captures image + audio (React)
   ↓
3. Multipart form sent to backend (Axios)
   ↓
4. Backend receives upload (Multer)
   ↓
5. Backend calls ML API (Axios)
   ↓
6. ML model analyzes image (TensorFlow)
   ↓
7. Prediction returned with confidence
   ↓
8. Backend stores result in Supabase (PostgreSQL)
   ↓
9. Frontend updates UI with prediction (React)
```

---

## 💡 Technology Rationale

### Why React?
- **Component-based architecture** — Reusable UI components
- **Large ecosystem** — Rich library support (Recharts, Leaflet, etc.)
- **Fast rendering** — Virtual DOM for performance
- **TypeScript support** — Type safety out of the box
- **Developer experience** — Extensive tooling & documentation

### Why Vite?
- **10-100x faster** than Webpack for development
- **Native ES modules** support
- **Instant Hot Module Replacement (HMR)**
- **Optimized build** for production
- **Zero-config** for most projects

### Why Express?
- **Lightweight & minimal** — Easy to understand & extend
- **Middleware ecosystem** — Plenty of battle-tested libraries
- **Flexible routing** — Supports all HTTP methods
- **Perfect for microservices** — Ideal for ML integration

### Why FastAPI?
- **Performance** — One of fastest Python frameworks (async/await)
- **Automatic documentation** — Swagger UI out of the box
- **Type hints** — Request/response validation
- **Easy to learn** — Clean syntax, great for ML engineers
- **CORS built-in** — Simple configuration

### Why Supabase?
- **PostgreSQL hosted** — No DevOps overhead
- **Row-Level Security** — Fine-grained access control
- **Built-in Auth** — Multiple providers, JWT tokens
- **Real-time subscriptions** — Live updates
- **Free tier generous** — Perfect for hackathon
- **Managed backups** — Peace of mind for data

### Why TypeScript?
- **Type safety** — Catch errors at compile time
- **Better IntelliSense** — Improved developer experience
- **Self-documenting code** — Types serve as documentation
- **Easier refactoring** — Compiler helps catch breaking changes
- **Production-ready** — Used in enterprise applications

### Why Multilingual UI?
- **Inclusivity** — Farmers speak local languages (Hindi, Marathi)
- **Market fit** — Essential for Indian market
- **React Context API** — Lightweight state management for i18n

### Why Docker?
- **Reproducible environments** — Same setup for dev/prod
- **Easy deployment** — One command to run ML model
- **Isolation** — No conflicts with system Python/dependencies
- **Scaling** — Can spin up multiple containers

---

## 📦 Dependency Management

### Frontend Dependencies Count
- **Production:** 7 main packages
- **Development:** 5 dev tools
- **Total:** 12 packages

### Backend Dependencies Count
- **Production:** 4 main packages
- **Development:** 5 dev tools
- **Total:** 9 packages

### ML Dependencies Count
- **Production:** 6 Python packages
- **Total:** 6 packages

### Security Practices
- ✅ No direct dev dependencies in production builds
- ✅ Lock files (`package-lock.json`) committed
- ✅ Regular updates via `npm audit`
- ✅ Type safety prevents runtime errors

---

## 📊 Performance Considerations

### Frontend Optimization
- **Vite** — Tree-shaking unused code
- **Recharts** — Lightweight charting library
- **React 19** — Concurrent rendering for responsiveness
- **Lazy loading** — Code-split routes with React Router

### Backend Performance
- **Express** — Minimal overhead, fast request handling
- **Multer** — Efficient file streaming
- **Axios** — HTTP connection pooling

### ML Model Performance
- **EfficientNetB0** — Lightweight (5.3M parameters)
- **224×224 input** — Faster than higher resolutions
- **Inference time** — ~100-200ms per image on CPU
- **Async processing** — Uvicorn handles concurrent requests

---

## 🔐 Security Features

| Layer | Security Measures |
|---|---|
| **Frontend** | HTTPS in production, CORS validation, secure token storage |
| **Backend** | Input validation, rate limiting (future), CORS whitelist |
| **Database** | Row-Level Security, encrypted passwords (Supabase Auth) |
| **ML Model** | Input validation (file type/size), sandboxed execution |
| **Secrets** | Environment variables, no hardcoded credentials |

---

## 🎯 Summary Table

| Aspect | Technology | Version |
|---|---|---|
| **Frontend Framework** | React | 19.2.8 |
| **Build Tool** | Vite | 8.2.2 |
| **Language (Frontend)** | TypeScript | 7.0.2 |
| **Backend Framework** | Express | 5.2.1 |
| **Language (Backend)** | Node.js | 18+ |
| **ML Framework** | FastAPI + TensorFlow | 2.21.0 |
| **Language (ML)** | Python | 3.11 |
| **Database** | PostgreSQL | (Supabase) |
| **Container** | Docker | Latest |
| **Package Managers** | npm, pip | Latest |
| **Linter** | OxLint | 1.79.0 |
| **Maps** | Leaflet | 1.9.4 |
| **Charts** | Recharts | 3.10.1 |

This modern, production-ready stack ensures **scalability**, **maintainability**, **performance**, and **developer experience** across all components of the PashuRaksha platform.
