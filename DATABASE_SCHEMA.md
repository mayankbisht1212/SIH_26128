# 📊 Database Schema Documentation

This document describes the PostgreSQL schema for PashuRaksha, hosted on Supabase.

---

## 🏗️ Overview

The database consists of **3 main tables**:
- `profiles` — User information (farmers, veterinarians)
- `animals` — Livestock inventory with health tracking
- `reports` — Disease outbreak reports with geospatial data

**Design Principles:**
- Row-Level Security (RLS) for multi-tenant data isolation
- Referential integrity with cascade deletes
- Timestamped audit trails
- Enumerated types for constrained values

---

## 📋 Table Definitions

### 1. **profiles** — User Profiles

Extends Supabase's built-in `auth.users` table with farmer/veterinarian data.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, FK → `auth.users.id` | Unique identifier (from Auth) |
| `full_name` | `text` | NULL allowed | User's full name |
| `phone` | `text` | NULL allowed | Contact number |
| `role` | `text` | NOT NULL, DEFAULT `'Farmer'` | `'Farmer'` or `'Veterinarian'` |
| `address` | `text` | NULL allowed | Physical location |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last profile update |

**Triggers:**
- Auto-created when a new Supabase user signs up (via `handle_new_user()` trigger)

**Row-Level Security (RLS):**
- Users can only view/edit their own profile
- Policy: `auth.uid() = id`

---

### 2. **animals** — Livestock Inventory

Tracks individual animals owned by farmers with vaccination schedules.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique animal identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `auth.users.id` | Farmer who owns this animal |
| `tag_id` | `text` | NOT NULL | Unique farm tag (e.g., "COW-001") |
| `species` | `text` | NOT NULL | `'Cow'`, `'Buffalo'`, `'Goat'`, etc. |
| `health_status` | `text` | NOT NULL, DEFAULT `'healthy'`, CHECK constraint | `'healthy'` \| `'sick'` |
| `last_vaccinated_on` | `date` | NULL allowed | Last vaccination date |
| `vaccine_name` | `text` | NULL allowed | Type of vaccine (e.g., "FMD") |
| `next_vaccination_on` | `date` | NULL allowed | Scheduled next vaccination |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record creation time |

**Unique Constraint:**
- `(owner_id, tag_id)` — A farmer cannot have duplicate tag IDs for their animals

**Row-Level Security (RLS):**
- Users can only view/edit their own animals
- Policy: `auth.uid() = owner_id`

**Example Data:**
```
id: 550e8400-e29b-41d4-a716-446655440000
owner_id: 123e4567-e89b-12d3-a456-426614174000
tag_id: COW-001
species: Cow
health_status: healthy
last_vaccinated_on: 2026-08-15
vaccine_name: FMD
next_vaccination_on: 2026-11-15
```

---

### 3. **reports** — Disease Outbreak Reports

Stores farmer reports of livestock disease with geospatial tracking.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique report ID |
| `reporter_id` | `uuid` | NOT NULL, FK → `auth.users.id` | Farmer who submitted report |
| `animal_id` | `uuid` | NULL allowed, FK → `animals.id` | Link to specific animal (optional) |
| `species` | `text` | NULL allowed | Species affected (e.g., "Cow") |
| `symptoms_text` | `text` | NULL allowed | Free-text symptom description |
| `selected_symptoms` | `text[]` | NOT NULL, DEFAULT `'{}'` | Array: `['Fever', 'Lesions', 'Lameness']` |
| `mortality_count` | `integer` | NOT NULL, DEFAULT `0`, CHECK ≥ 0 | Number of animals dead |
| `village` | `text` | NULL allowed | Village name |
| `block` | `text` | NULL allowed | Administrative block |
| `district` | `text` | NULL allowed | District name |
| `latitude` | `numeric` | NULL allowed | GPS latitude |
| `longitude` | `numeric` | NULL allowed | GPS longitude |
| `assessment` | `text` | NULL allowed | AI/veterinarian assessment (from ML API) |
| `status` | `text` | NOT NULL, DEFAULT `'pending'`, CHECK constraint | `'pending'` \| `'reviewed'` \| `'resolved'` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Report submission timestamp |

**Row-Level Security (RLS):**
- Users can only view/edit their own reports
- Policy: `auth.uid() = reporter_id`

**Example Data:**
```
id: 660e8400-e29b-41d4-a716-446655440001
reporter_id: 123e4567-e89b-12d3-a456-426614174000
animal_id: 550e8400-e29b-41d4-a716-446655440000
species: Cow
symptoms_text: "Red patches on body, fever for 3 days"
selected_symptoms: ['Fever', 'Skin_Lesions', 'Reduced_Milk']
mortality_count: 0
village: "Nashik"
block: "Nandgaon"
district: "Nashik"
latitude: 19.9975
longitude: 73.7898
assessment: "Lumpy Skin Disease (LSC) - 94% confidence"
status: pending
created_at: 2026-09-01T10:30:00Z
```

---

## 🔗 Relationships

```
auth.users (Supabase built-in)
    ↓
    └→ profiles (1:1)
       ↓
       ├→ animals (1:N)
       │  ↓
       │  └→ reports (1:N, optional)
       │
       └→ reports (1:N)
```

**Cardinality:**
- **Farmer → Animals:** 1:N (one farmer can own many animals)
- **Farmer → Reports:** 1:N (one farmer can submit many reports)
- **Animal → Reports:** 1:N (one animal can have many reports, nullable)

**Cascade Deletes:**
- If a user is deleted from `auth.users`, all their `profiles`, `animals`, and `reports` are automatically deleted

---

## 🔒 Security — Row-Level Security (RLS)

All tables use PostgreSQL RLS to enforce data isolation:

### profiles
```sql
CREATE POLICY "Users manage their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);
```
**Effect:** Users can only read/write their own profile row.

### animals
```sql
CREATE POLICY "Users manage their own animals"
ON public.animals FOR ALL
USING (auth.uid() = owner_id) 
WITH CHECK (auth.uid() = owner_id);
```
**Effect:** Users can only see/edit animals they own.

### reports
```sql
CREATE POLICY "Users manage their own reports"
ON public.reports FOR ALL
USING (auth.uid() = reporter_id) 
WITH CHECK (auth.uid() = reporter_id);
```
**Effect:** Users can only view/update reports they created.

---

## 🔄 Triggers & Functions

### `handle_new_user()` Function

**Purpose:** Auto-populate `profiles` when a new Supabase user signs up.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    COALESCE(new.raw_user_meta_data ->> 'role', 'Farmer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
```

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_new_user();
```

**Flow:**
1. User signs up via Supabase Auth
2. Trigger fires automatically
3. New `profiles` row created with user's metadata

---

## 📝 Type-Safe Frontend Integration

Supabase CLI generates TypeScript types from this schema:

**File:** [`frontend/src/lib/database.types.ts`](frontend/src/lib/database.types.ts)

**Usage Example:**
```typescript
import { Database } from './lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type InsertReport = Database['public']['Tables']['reports']['Insert'];

// Type-safe query
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
// profile is automatically typed as Profile
```

---

## 🚀 How It Works with the ML Model

1. **Farmer submits report** with image + audio
2. **Backend receives request** → calls ML API at `localhost:5000/predict`
3. **ML Model analyzes image** → returns `{prediction, confidence}`
4. **Backend stores result** in `reports.assessment` column
5. **Frontend displays** prediction to farmer

**Future Enhancement:**
Add an `ml_predictions` table to track model versions:
```sql
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  model_version TEXT,
  prediction TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Migration & Deployment

### How to Run the Migration

**Option 1: Supabase Dashboard**
1. Go to **SQL Editor** in Supabase console
2. Click **New Query**
3. Paste contents of [`supabase/migrations/20260901_initial_schema.sql`](supabase/migrations/20260901_initial_schema.sql)
4. Click **Run**

**Option 2: Supabase CLI**
```bash
supabase migration up
```

### Regenerating TypeScript Types

After schema changes, regenerate types:
```bash
supabase gen types typescript \
  --project-id your-supabase-project-id > \
  frontend/src/lib/database.types.ts
```

---

## 📊 Schema Versioning

All migrations are version-controlled in `supabase/migrations/` folder:

```
supabase/migrations/
├── 20260901_initial_schema.sql    (v1: profiles, animals, reports)
├── 20260902_add_ml_predictions.sql (future: ML tracking)
└── ...
```

Each migration file is timestamped and immutable. This allows:
- ✅ Easy rollback
- ✅ Clear change history
- ✅ Team collaboration (no conflicts)
- ✅ Database as code

---

## 🎯 Summary

| Aspect | Details |
|---|---|
| **Database** | PostgreSQL (hosted on Supabase) |
| **Tables** | 3 (profiles, animals, reports) |
| **Security** | Row-Level Security (RLS) on all tables |
| **Type Safety** | Auto-generated TypeScript types |
| **Migrations** | SQL files in `supabase/migrations/` |
| **Auth** | Supabase Auth (multi-provider) |
| **Triggers** | Auto-profile creation on user signup |

This design ensures **secure**, **type-safe**, and **scalable** data management for the livestock disease surveillance platform.
