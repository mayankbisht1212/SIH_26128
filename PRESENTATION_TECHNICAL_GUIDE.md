# PashuRaksha: Presentation and Technical Q&A Guide

> **Problem focus:** early livestock disease reporting, triage, and surveillance.  
> **One-line pitch:** PashuRaksha lets a farmer submit a geo-tagged animal photo and voice note, obtains an ML-assisted visual triage result, securely records the case, and presents herd and outbreak-awareness tools in a low-friction multilingual web interface.

This document is the authoritative presentation guide for the current repository. It distinguishes what is implemented today from planned production extensions so the team can answer judges accurately.

## 1. What the project solves

Livestock disease reporting is often delayed because the first reporter is a farmer with limited time, uncertain disease knowledge, variable connectivity, and a preference for local languages. A late report makes isolation, veterinary intervention, and outbreak monitoring harder.

PashuRaksha reduces that delay by combining:

- a photo-first symptom report with an optional spoken description;
- a visual ML classifier for immediate, **assistive** triage;
- GPS-derived village/block/district context;
- secure report and media persistence;
- individual herd/vaccination management; and
- map/trend views designed to make surveillance data understandable.

It is not presented as a replacement for a veterinarian. The model ranks one of a limited set of visual classes and the UI recommends veterinary review where appropriate.

## 2. Architecture at a glance

```text
                         HTTPS / JSON + multipart form data
┌──────────────────┐       ┌───────────────────────┐       ┌──────────────────────┐
│ React + Vite UI  │──────▶│ Node.js / Express API │──────▶│ FastAPI ML service   │
│ browser client   │       │ validation + proxy    │       │ TensorFlow model     │
└───────┬──────────┘       └───────────────────────┘       └──────────────────────┘
        │                         ▲
        │ Supabase SDK             │ ML_API_URL environment variable
        ▼                         │
┌─────────────────────────────────┴──────────────────────────────────────────────┐
│ Supabase: Auth + PostgreSQL + private Storage                                   │
│ profiles | animals | reports | report-media/<authenticated-user-id>/<report-id> │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Why use three application layers instead of calling the ML server directly?

The browser sends media to the Express API (`POST /api/ml/predict`), not directly to FastAPI. Express validates upload presence/type/size and forwards only accepted data to the ML service. This keeps the ML URL swappable through `ML_API_URL`, gives one public application API, and creates a natural future location for rate limiting, audit logging, request authentication, queueing, and model-version routing. Direct browser-to-model calls are simpler, but expose the model endpoint and couple the UI to its internal API.

## 3. Repository map

| Folder/file | Responsibility |
|---|---|
| `frontend/` | React browser application, user journeys, maps, charts, Supabase client |
| `frontend/src/components/ReportForm.tsx` | Media capture, category selection, ML request, result rendering, report persistence |
| `backend/` | Express multipart proxy to ML service |
| `backend/Dockerfile` | Multi-stage production container for Render-compatible deployment |
| `livestock-disease-api-v2/` | FastAPI + TensorFlow inference server and trained `.keras` model |
| `supabase/migrations/20260901_initial_schema.sql` | Core PostgreSQL tables, RLS, user-profile trigger |
| `supabase/migrations/20260902_ml_report_media.sql` | ML result columns and private media bucket policy |
| `TECH_STACK.md` / `DATABASE_SCHEMA.md` | Supporting reference documents; this guide reflects the current end-to-end implementation |

## 4. End-to-end report workflow

This is the most useful sequence to explain in a demo.

1. A farmer selects/captures an animal photo on the dashboard. A `FileReader` transfers it to the report route as a browser data URL.
2. In the report form, the farmer records a voice note using the browser `MediaRecorder` API. The completed chunks become an `audio/webm` `Blob`; a local audio player provides confirmation before submission.
3. The user optionally adds typed symptoms, species, tag, mortality count, symptom tags, and location.
4. The browser requests geolocation through `navigator.geolocation`. It uses OpenStreetMap Nominatim reverse geocoding when available and falls back to a visible default sector if GPS is unavailable.
5. On submit, the browser requires both photo and recorded audio for ML analysis. It constructs `multipart/form-data` with fields named `file` and `audio`.
6. The browser calls `POST {VITE_API_URL}/api/ml/predict`.
7. Express uses Multer in memory mode, limits uploads to two files and 15 MB per file, checks that the MIME types begin with `image/` and `audio/`, then forwards equivalent multipart data to `{ML_API_URL}/predict`.
8. FastAPI validates the same two inputs. It decodes the image, converts it to RGB, resizes it to 224 × 224, forms a batch of one image, and calls `model.predict`.
9. The API returns the winning class, full class probabilities, numerical confidence, and confirmation that audio was received.
10. React maps model output to a cautious presentation label, risk color, and practical precautions. The final report screen displays the actual returned class and confidence.
11. With a valid Supabase session, the browser saves photo/audio to private Storage and inserts the case metadata, model output, and Storage paths in `reports`.

### Why multipart form data?

Images and audio are binary. `multipart/form-data` preserves binary bytes and original MIME metadata without base64 inflation; encoding to base64 would add roughly one-third size overhead and increase client/server memory use. It is the standard format supported by browser `FormData`, Multer, and FastAPI `UploadFile`.

## 5. Frontend design choices

### React 19 + TypeScript + Vite

- **React** suits a screen-based, stateful workflow: recording state, report steps, location state, selection chips, loading/error states, and final diagnosis state.
- **TypeScript** catches mismatch errors at compile time: API response fields, database insert fields, components, and event types. This matters for a multi-service app because many faults otherwise surface only during a farmer’s submission.
- **Vite** gives fast local startup and optimized static build output. It is a good fit because this is a client-rendered web app, not SEO-driven server-rendered content.

**Why not Flutter/React Native?** A native app can provide stronger offline/background support, but takes longer to distribute and test across devices. A responsive web app works immediately from a link and can later be wrapped or rebuilt as a mobile app using the same API contracts.

**Why not plain JavaScript?** Plain JavaScript lowers initial ceremony but loses compile-time guarantees at service boundaries. For disease reporting, a failed upload caused by a misspelled database field is avoidable risk.

### Routing and access control

`react-router-dom` provides client-side routes for `/dashboard`, `/report`, `/herd`, `/advisories`, and `/trends`. `ProtectedRoutes` prevents access to the main UI if no session exists.

The current demo supports a simulated OTP (`123456`) to avoid SMS cost. For a real database/media session, Supabase must create a genuine authenticated or anonymous session. Production should replace demo OTP with a configured phone OTP provider or another verified sign-in provider.

### Internationalization and accessibility

`LanguageContext` and `translations.ts` centralize English, Hindi, and Marathi copy. Centralizing strings avoids language logic being spread through components and makes later additions (Gujarati, Bengali, Tamil, etc.) straightforward. Icons come from Lucide, so buttons retain text labels rather than relying on visuals alone.

### Maps and analytical UI

- **Leaflet / React Leaflet**: mature, open-source, lightweight mapping without a proprietary Google Maps dependency.
- **Recharts**: declarative React charts for vaccination and trend summaries.
- **Haversine distance**: calculates great-circle distance from latitude/longitude, suitable for local proximity warnings.

**Truthful demo note:** the current `Trends.tsx` contains curated district/KPI data for UI demonstration; it is not yet a live aggregation pipeline over all submitted reports. The storage schema and report coordinates are the foundation for replacing this with PostgreSQL/PostGIS queries, scheduled aggregates, and Supabase Realtime updates.

## 6. Backend API design

### Current endpoints

| Endpoint | Method | Purpose | Important responses |
|---|---|---|---|
| `/api/health` | `GET` | Liveness/config diagnostic | `{ status: "ok", mlApiUrl }` |
| `/api/ml/predict` | `POST` | Validates and proxies photo/audio to ML API | `200` model response; `400` invalid/missing media; `502` ML unavailable |

### Why Node.js + Express?

The frontend team can use TypeScript end-to-end, Express is widely understood, and its middleware model makes file upload validation, CORS, authentication, rate limits, and logging easy to add. Node is not doing computational ML work; it is orchestrating I/O, which matches its strengths.

**Why not call TensorFlow from Node?** Python has the strongest TensorFlow/Keras ecosystem and the existing model is a Keras `.keras` artifact. Keeping inference in Python avoids conversion risk and lets the API use common ML libraries directly.

### Why Multer memory storage?

The API forwards files immediately and does not need local persistence. Memory storage avoids writing sensitive images/audio to ephemeral server disks and works well with stateless containers. The tradeoff is memory pressure, which is why the 15 MB limit must remain and production should add rate limiting and optionally direct-to-Storage signed uploads for large scale.

### CORS

`cors()` is intentionally permissive for local development. Production must allow only the known frontend origin(s), for example `https://your-app.pages.dev`, to reduce unauthorized browser use of the proxy.

## 7. ML service and model explanation

### FastAPI

FastAPI is used because it has concise request validation, first-class async-friendly file uploads, automatic OpenAPI documentation, and excellent Python ML integration. It runs under Uvicorn, an ASGI server.

### Model contract

| Item | Current implementation |
|---|---|
| Model file | `best_livestock_model.keras` |
| Runtime | TensorFlow 2.21 / Keras |
| Architecture advertised by API | EfficientNetB0 |
| Input | RGB image resized to 224 × 224 |
| Output classes | `Healthy`, `Lumpy_Skin`, `Other_Infections` |
| Confidence | maximum softmax/probability score, displayed as percentage |
| API response | winning class, confidence, all probabilities, audio receipt metadata |

### Why EfficientNetB0?

EfficientNetB0 is a sensible mobile/edge-oriented convolutional baseline: it uses compound scaling to balance depth, width, and image resolution, and is substantially lighter than large vision backbones while retaining useful accuracy. For a farmer-facing triage app, low latency and deployability matter as much as benchmark accuracy.

**Why not a huge vision transformer?** Larger transformers can perform strongly with abundant labeled data and compute, but require more memory, longer cold starts, and more training data. EfficientNetB0 is easier to run on CPU-oriented demo infrastructure.

### Important model limitations to say explicitly

1. The classifier recognizes only **three current image classes**, not every livestock disease.
2. `Other_Infections` is a broad fallback, not a confirmed diagnosis.
3. Confidence is a score relative to model classes; it is not a clinical probability or veterinary prescription.
4. The current API **receives and validates audio but does not transcribe or use it in prediction**. The audio is retained as case evidence; speech-to-text and multimodal fusion are planned extensions.
5. The model requires representative, ethically sourced, labeled data and evaluation across breeds, illumination, camera quality, skin/coat colors, geographic regions, and disease stages before clinical deployment.

### Why still collect audio now?

Audio gives farmers a low-literacy input path and captures symptom context that may not be visually visible: onset, feeding behavior, milk-yield changes, cough, and recent mortality. The stable media/API contract is already present, so an ASR service (for example Whisper or an Indic-language speech model) can later convert it to text and a fusion/rules layer can combine it with image and structured symptoms.

## 8. Database, media, and security

### PostgreSQL via Supabase

Supabase was selected because it combines managed PostgreSQL, browser-compatible authentication, Storage, Row-Level Security (RLS), and a JavaScript SDK. This eliminates the overhead of separately operating a database, object store, auth provider, and custom authorization layer during the prototype stage.

### Data model

```text
auth.users
  ├── profiles (1:1)
  ├── animals  (1:N)
  └── reports  (1:N) ── optional animal_id ──▶ animals

reports also stores: ML disease/confidence + image/audio Storage paths
```

| Table | Why it exists |
|---|---|
| `profiles` | Extends Supabase `auth.users` with role, phone, address, name |
| `animals` | Herd inventory, species, health state, vaccination dates; unique tag per owner |
| `reports` | Structured case facts, geolocation, selected symptoms, case status, ML output, media references |

Media is not stored inside PostgreSQL binary columns. Instead, objects are uploaded to the private `report-media` Storage bucket and the table stores their paths. This is the right separation: relational databases excel at metadata/querying, while object storage is designed for large blobs and scalable delivery.

### RLS in one sentence

RLS enforces `auth.uid() = owner/reporter id` at the database itself, so a user cannot read or modify another farmer’s data merely by changing an ID in the browser request.

### Why have a profile trigger?

`handle_new_user()` runs after an Auth user is created and inserts an application profile in the same database. This prevents scattered “create profile after signup” logic in every client and keeps identity/profile relationships consistent.

### Production security checklist

- Never expose a Supabase `service_role` key in the frontend.
- Restrict Express and FastAPI CORS origins.
- Require a verified Supabase JWT at the Express API and validate it server-side.
- Rate-limit `POST /api/ml/predict`; impose content-length/type checks and malware scanning where applicable.
- Use signed URLs or server authorization to read private media.
- Log model version, request timestamp, user consent, and audit events.
- Encrypt traffic with HTTPS; do not log photos, audio, tokens, or personally identifiable information.
- Define media retention/deletion policies and obtain informed farmer consent.

## 9. Deployment and configuration

### Environment variables

| Variable | Set in | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend build environment | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend build environment | browser-safe Supabase credential |
| `VITE_API_URL` | frontend build environment | public Express API base URL |
| `PORT` | backend host (Render supplies it) | HTTP listener port |
| `ML_API_URL` | backend host | FastAPI model-service base URL |

Variables beginning with `VITE_` are embedded into the frontend bundle; only public values belong there. `ML_API_URL` is server-side configuration and should not be exposed to the browser.

### Containers

The backend Dockerfile uses a multi-stage build:

1. build stage: `npm ci`, compile TypeScript to `dist/`;
2. runtime stage: install only production dependencies, copy compiled JavaScript, run `node dist/index.js`.

This produces a smaller runtime image and avoids shipping TypeScript tooling into production. Render provides `PORT`; the backend reads it with a default of 4000 for local development.

The FastAPI model service has its own Dockerfile so TensorFlow dependencies and model weights are isolated from the Node service.

### Deployment choices for the demo

- **Frontend:** Cloudflare Pages or another static host.
- **Backend:** Render web service using `backend/Dockerfile`.
- **ML:** a container-capable service with enough RAM for TensorFlow; Google Cloud Run is suitable for low-volume demonstrations if quotas/billing controls are configured.
- **Database/media:** Supabase Free for prototyping.

Do not claim that free tiers are unlimited or production-grade. Free services can sleep, pause, have quotas, and may require a billing account. TensorFlow generally exceeds low-memory free services.

## 10. Failure handling and observability

| Failure | Current behavior | Production improvement |
|---|---|---|
| No photo/audio | client blocks ML submission with actionable message | show per-field validation earlier |
| Invalid MIME type | Express/FastAPI return 400 | inspect magic bytes, not MIME alone |
| ML server down | Express returns 502; UI preserves report flow/error | retry with backoff, queue case for later inference |
| Supabase session missing | report persistence reports session-expired error | require verified login before form; refresh token automatically |
| GPS unavailable | fallback sector is used | let user edit/confirm location; maintain offline queue |
| Free host cold start | request can be slow | loading status, health check, warm strategy where affordable |

Add structured logging, request IDs, latency metrics, model version, error tracking, and dashboards before a real pilot.

## 11. Testing and validation already used

- Frontend: `npm run typecheck` and `npm run build`.
- Backend: `npm test` (TypeScript no-emit check) and `npm run build`.
- Backend container: Docker image build verified locally.
- Manual functional test to perform before presentation: submit photo + audio, observe ML response, confirm Storage objects and report row in Supabase, then verify the final UI card.

For a model evaluation, report a held-out test set, confusion matrix, per-class precision/recall/F1, calibration, inference latency, and failure examples. Do not make accuracy claims unless backed by an experiment log.

## 12. Judge Q&A: concise, defensible answers

### Why is this needed when farmers can call a veterinarian?

Calling remains important. PashuRaksha makes the first report structured, geo-tagged, and shareable, helping veterinary teams prioritize and monitor cases rather than replacing clinical care.

### Why image AI?

Visible signs such as skin lesions and nodules are useful early signals. A camera is already available on most phones, so image triage minimizes manual form entry. The result is assistance, not a final diagnosis.

### Why not use only a text chatbot?

Text descriptions are subjective and can be difficult in low-literacy or multilingual settings. Images provide direct visual evidence; audio supports a spoken description. A future system will fuse image, transcript, structured symptoms, and location.

### Does the audio currently influence the disease prediction?

No. It is validated, transmitted, stored, and shown as evidence, but the present TensorFlow classifier uses the photo only. This is an intentional transparent limitation, and ASR/multimodal fusion is the next step.

### Why classify only three categories?

Start with a narrow, auditable problem and expand only after collecting validated data. Broad disease catalogs without training coverage cause misleading confidence. `Other_Infections` routes uncertainty toward veterinary review.

### Why not diagnose every disease from a single photograph?

Many diseases share visual signs, while stage, breed, lighting, and secondary infections change appearance. Clinical diagnosis needs examination, history, and sometimes lab testing. The app is a surveillance/triage tool.

### Why EfficientNetB0 rather than a larger network?

It offers a practical accuracy/latency/memory tradeoff for 224 × 224 images and CPU-capable deployment. A larger model must justify its resource cost with measured improvement on representative livestock data.

### How do you prevent false reassurance?

The UI uses cautious language, gives basic precautions, preserves raw model result, provides a veterinary-review route for non-healthy/uncertain results, and should be coupled with threshold calibration and human escalation rules in production.

### Why FastAPI for ML?

It is Python-native, accepts typed file uploads, supports async server patterns, and integrates directly with TensorFlow/Keras. Keeping model execution in Python avoids unsafe model conversion to another runtime.

### Why Express between UI and FastAPI?

It provides an API boundary: media validation, size limits, a stable public endpoint, future authentication, rate limiting, auditing, and ML service substitution. It prevents the UI from being tightly coupled to the model service.

### Why PostgreSQL/Supabase instead of MongoDB?

The domain has clear relationships: users own animals; animals and users create reports; reports have status, location, and time filters. PostgreSQL gives constraints, joins, transactions, geospatial extensibility, and RLS. Supabase reduces operational complexity around auth/storage.

### Why RLS if the frontend already has checks?

Browser checks are not a security boundary. A malicious user can alter a request. RLS is enforced in the database, so ownership remains protected even if a client is modified.

### Why object storage instead of placing image/audio bytes in the database?

Object storage handles large files more efficiently and keeps database rows small and queryable. The relational record keeps secure paths and metadata for each piece of evidence.

### How will the system scale?

Keep web/API/ML services stateless; scale them independently. Move large media to direct signed uploads, queue inference jobs, cache model workers, use database indexes and geospatial aggregation, and add observability/rate limits.

### What happens in low connectivity areas?

The current web prototype provides graceful errors and local UI fallback data. A production offline-first version should store an encrypted report/media queue in IndexedDB or a native app, retry on connectivity, and show sync status.

### Is the map live?

The map UX and geospatial calculations are implemented, but the current district trend/KPI dataset is curated demo data. The next step is a live query/aggregation layer over validated `reports` data.

### How would you make outbreak alerts scientifically robust?

Use verified reports, deduplicate cases, incorporate time windows and population denominators, run spatial clustering/hotspot methods, apply epidemiologist-defined thresholds, and always retain human review before public alerts.

### What privacy safeguards are necessary?

Private media storage, RLS, minimum required data collection, explicit consent, retention/deletion policy, encrypted transport, role-based access, audit logs, and no public exposure of farmer location or animal evidence.

### Why web instead of a native app?

For the prototype, zero-install access and rapid iteration maximize reach. The APIs are platform-neutral, so a Flutter/React Native app can be added later for stronger offline capture and device integration.

### What would you do next with more time?

1. Real phone/email/social authentication and role-based veterinarian dashboards.
2. Audio transcription for Indian languages and multimodal model/rules fusion.
3. Live outbreak aggregation with PostGIS and validated-alert workflow.
4. Offline-first mobile capture and reliable background synchronization.
5. Rigorous model dataset governance, evaluation, threshold calibration, and clinical validation.

## 13. Suggested live-demo script

1. State the problem in one sentence: delayed, unstructured farm-level reporting delays response.
2. Sign in using the configured demo/real authentication flow.
3. Upload an animal image and record a short voice description.
4. Select species and visible symptoms; show auto-location.
5. Submit and narrate: browser → Express validation/proxy → FastAPI/TensorFlow → final result.
6. Show class, confidence, safety-oriented precautions, attached evidence, and report summary.
7. Open herd management and map/trends, clearly saying the current map data is a demonstration layer awaiting live aggregation.
8. End with the roadmap: verified reports + human review + multilingual transcription + live surveillance.

## 14. Claims to avoid

For credibility, do **not** claim any of the following unless implemented and measured:

- “The app definitively diagnoses livestock disease.”
- “Audio is already analyzed by the ML model.”
- “The map shows nationwide real-time government surveillance data.”
- “The model works for every animal species/disease.”
- A specific accuracy percentage without a documented held-out evaluation.
- “Free hosting is unlimited or production-ready.”

Instead say: “This prototype demonstrates a secure, extensible pipeline for AI-assisted visual triage and structured surveillance reporting.”
