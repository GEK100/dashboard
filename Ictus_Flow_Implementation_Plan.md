# ICTUS FLOW - COMPLETE IMPLEMENTATION PLAN
## Construction Intelligence Platform for SME Main Contractors & M&E Subcontractors

---

# SECTION 1: SYSTEM ARCHITECTURE

## 1.1 Technology Stack

```
Frontend:        Next.js 14 (App Router)
Backend:         Next.js API Routes + Supabase Edge Functions
Database:        Supabase PostgreSQL
Authentication:  Supabase Auth (email/password + magic link)
AI:              Claude Opus 4.5 (Anthropic API)
Voice:           OpenAI Whisper API
File Storage:    Supabase Storage
Hosting:         Vercel
Mobile:          PWA (Progressive Web App)
Offline:         Service Workers + IndexedDB sync
```

## 1.2 Multi-Tenant Architecture

This is a SaaS product serving multiple contractor companies. Each company is a "tenant".

```
Database Structure:
├── companies (tenants)
│   ├── users (belong to one company, except subcontractors)
│   ├── projects (belong to one company)
│   │   ├── project_users (role per project)
│   │   ├── rfis
│   │   ├── rams
│   │   ├── diary_entries
│   │   ├── attendance
│   │   ├── progress
│   │   ├── blockers
│   │   ├── drawings
│   │   └── reports
│   └── lessons_learnt
└── subcontractor_accounts (can access multiple companies)
```

## 1.3 White-Label Configuration

Each company can configure:
- Company logo (header + login page)
- Primary brand colour
- Secondary brand colour
- Company name
- Custom subdomain (optional: clientname.ictusflow.com)
- Client portal branding (separate logo if needed)

---

# SECTION 2: USER ROLES & PERMISSIONS

## 2.1 Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| **Super Admin** | Platform | Ictus Flow staff only. Manages all tenants. |
| **Admin** | Company | Company owner. Creates projects, manages all users. |
| **Director** | Company | Views all projects. Cannot edit. High-level dashboards. |
| **Project Manager** | Project(s) | Full control of assigned projects. Can add users/subs. |
| **Site Supervisor** | Project(s) | Field user. Diary, attendance, photos, progress updates. |
| **QS/Commercial** | Project(s) | Financial tracking, variations, valuations (if enabled). |
| **H&S Manager** | Project(s) | Safety features, RAMS approval, incidents. |
| **Subcontractor** | Project(s) | Uploads RAMS, signs in to site, views assigned info. |
| **Client** | Project(s) | External. Views only what's enabled in client portal. |
| **Viewer** | Project(s) | Read-only access to assigned projects. |

## 2.2 Permission Matrix

| Feature | Admin | Director | PM | Site Super | QS | H&S | Subcon | Client | Viewer |
|---------|-------|----------|----|-----------|----|-----|--------|--------|--------|
| **Company Settings** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create Project** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Edit Project Settings** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Add Users to Project** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View All Projects** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Assigned Projects** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create RFI** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Respond to RFI** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Upload RAMS** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Approve RAMS** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Create Diary Entry** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Site Sign In/Out** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Verify Attendance** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Update Progress** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create Blocker** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Resolve Blocker** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Generate Report** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Configure Client Portal** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Add Lesson Learnt** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Lessons Learnt** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

## 2.3 Subcontractor Multi-Company Access

Subcontractors are special:
- They have ONE account (email)
- They can be invited by MULTIPLE companies
- When they log in, they see a "Company Switcher" or tabs
- Each company's projects appear under that company's tab
- They only see projects they're assigned to

---

# SECTION 3: DATABASE SCHEMA

## 3.1 Core Tables

### companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1B4F72',
  secondary_color VARCHAR(7) DEFAULT '#2874A6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Settings
  default_rfi_days INTEGER DEFAULT 7,
  default_warning_days INTEGER DEFAULT 2,
  client_portal_enabled BOOLEAN DEFAULT true
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id), -- NULL for subcontractors
  role VARCHAR(50) NOT NULL, -- 'admin', 'director', 'pm', 'site_super', 'qs', 'hs', 'viewer'
  is_subcontractor BOOLEAN DEFAULT false,
  is_client BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- For biometric verification
  profile_photo_url TEXT,
  
  -- Notification preferences
  notify_overdue BOOLEAN DEFAULT true,
  notify_assigned BOOLEAN DEFAULT true
);
```

### subcontractor_companies (many-to-many for subs)
```sql
CREATE TABLE subcontractor_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  company_name VARCHAR(255), -- Subcontractor's company name
  trade VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  reference VARCHAR(100),
  address TEXT,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius INTEGER DEFAULT 100, -- meters
  
  -- Dates
  start_date DATE,
  target_completion DATE,
  actual_completion DATE,
  
  -- Value
  contract_value DECIMAL(15, 2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'live', -- 'live', 'practical_completion', 'defects', 'closed'
  
  -- Settings
  rfi_response_days INTEGER DEFAULT 7,
  warning_threshold_days INTEGER DEFAULT 2,
  
  -- Client Info
  client_name VARCHAR(255),
  client_contact_name VARCHAR(255),
  client_contact_email VARCHAR(255),
  client_sector VARCHAR(100), -- 'NHS', 'MoJ', 'Education', 'Commercial', etc.
  
  -- Project Type
  project_type VARCHAR(100), -- 'Refurbishment', 'New Build', 'Fit-out'
  building_type VARCHAR(100), -- 'Healthcare', 'Government', 'Education', 'Commercial'
  
  -- Hero Image
  hero_image_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### project_risk_profile
```sql
CREATE TABLE project_risk_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Standard Risks (boolean toggles)
  occupied_building BOOLEAN DEFAULT false,
  working_at_height BOOLEAN DEFAULT false,
  hot_works BOOLEAN DEFAULT false,
  live_services BOOLEAN DEFAULT false,
  asbestos_presence BOOLEAN DEFAULT false,
  confined_spaces BOOLEAN DEFAULT false,
  public_interface BOOLEAN DEFAULT false,
  manual_handling BOOLEAN DEFAULT false,
  hazardous_substances BOOLEAN DEFAULT false,
  lifting_operations BOOLEAN DEFAULT false,
  
  -- Custom Risks (JSON array)
  custom_risks JSONB DEFAULT '[]',
  -- Example: [{"name": "Court in session - silence 9am-5pm", "enabled": true}]
  
  -- Scope of Works Document
  scope_document_url TEXT,
  scope_text TEXT, -- Extracted/pasted text for AI analysis
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### project_users
```sql
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role VARCHAR(50) NOT NULL, -- Role for THIS project
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(project_id, user_id)
);
```

### client_portal_settings
```sql
CREATE TABLE client_portal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) UNIQUE NOT NULL,
  
  -- Module visibility
  show_programme BOOLEAN DEFAULT true,
  show_progress_photos BOOLEAN DEFAULT true,
  show_rag_status BOOLEAN DEFAULT true,
  show_weekly_report BOOLEAN DEFAULT true,
  show_rfi_register BOOLEAN DEFAULT false,
  show_rfi_count_only BOOLEAN DEFAULT true, -- If true, show count not details
  show_drawing_register BOOLEAN DEFAULT false,
  show_key_risks BOOLEAN DEFAULT false,
  show_hs_stats BOOLEAN DEFAULT true,
  
  -- Never show (hardcoded off)
  -- blockers, daily_diary, costs, subcontractor_performance
  
  -- Custom welcome message
  welcome_message TEXT,
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3.2 RFI Tables

### rfis
```sql
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Identification
  rfi_number INTEGER NOT NULL, -- Auto-increment per project
  reference VARCHAR(50), -- e.g., "RFI-001"
  
  -- Content
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255), -- Zone/Area
  trade VARCHAR(100),
  
  -- Assignment
  assigned_to VARCHAR(255), -- Consultant name/company
  assigned_to_email VARCHAR(255),
  
  -- Dates
  date_raised DATE DEFAULT CURRENT_DATE,
  date_required DATE NOT NULL,
  date_responded DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'responded', 'closed'
  is_overdue BOOLEAN DEFAULT false,
  
  -- Response
  response TEXT,
  response_by VARCHAR(255),
  
  -- Attachments (JSON array of URLs)
  attachments JSONB DEFAULT '[]',
  response_attachments JSONB DEFAULT '[]',
  
  -- Linked items
  linked_drawing_id UUID,
  linked_blocker_id UUID,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3.3 RAMS Tables

### rams_submissions
```sql
CREATE TABLE rams_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Subcontractor
  subcontractor_id UUID REFERENCES users(id),
  subcontractor_company VARCHAR(255),
  package_name VARCHAR(255), -- e.g., "Electrical First & Second Fix"
  
  -- Document
  document_url TEXT NOT NULL,
  document_name VARCHAR(255),
  version INTEGER DEFAULT 1,
  
  -- Submission
  submitted_at TIMESTAMP DEFAULT NOW(),
  submitted_by_name VARCHAR(255),
  submitted_by_email VARCHAR(255),
  
  -- AI Analysis
  ai_score INTEGER, -- 0-100
  ai_status VARCHAR(50), -- 'pass', 'minor_issues', 'requires_revision'
  ai_analysis JSONB, -- Full analysis result
  ai_reviewed_at TIMESTAMP,
  
  -- PM Review
  pm_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revision_required'
  pm_comments TEXT,
  pm_reviewed_at TIMESTAMP,
  pm_reviewed_by UUID REFERENCES users(id),
  
  -- Feedback sent
  feedback_sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### rams_packages (for tracking expected submissions)
```sql
CREATE TABLE rams_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  subcontractor_id UUID REFERENCES users(id),
  package_name VARCHAR(255) NOT NULL,
  scope_description TEXT,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'awaiting', -- 'awaiting', 'submitted', 'approved'
  current_submission_id UUID REFERENCES rams_submissions(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.4 Daily Diary Tables

### diary_entries
```sql
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Entry details
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_time TIME DEFAULT CURRENT_TIME,
  
  -- Content
  category VARCHAR(50), -- 'progress', 'issue', 'instruction', 'visitor', 'hs', 'weather', 'delivery', 'general'
  transcribed_text TEXT NOT NULL,
  original_audio_url TEXT,
  
  -- Location/Context
  zone VARCHAR(100),
  location_description VARCHAR(255),
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  
  -- Photos
  photos JSONB DEFAULT '[]', -- Array of {url, caption}
  
  -- AI Analysis
  ai_entities JSONB, -- Extracted entities: zones, trades, subcontractors, materials
  ai_suggestions JSONB, -- Suggested actions
  ai_linked_rfis JSONB, -- Related RFI IDs
  ai_linked_blockers JSONB,
  ai_sentiment VARCHAR(50), -- 'positive', 'neutral', 'concern'
  
  -- Author
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.5 Attendance Tables

### site_attendance
```sql
CREATE TABLE site_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Sign in
  sign_in_time TIMESTAMP NOT NULL,
  sign_in_latitude DECIMAL(10, 8),
  sign_in_longitude DECIMAL(11, 8),
  sign_in_photo_url TEXT,
  sign_in_verified BOOLEAN DEFAULT false,
  
  -- Sign out
  sign_out_time TIMESTAMP,
  sign_out_latitude DECIMAL(10, 8),
  sign_out_longitude DECIMAL(11, 8),
  auto_sign_out BOOLEAN DEFAULT false, -- If left geofence
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'disputed'
  dispute_reason TEXT,
  
  -- Induction check
  induction_valid BOOLEAN DEFAULT false,
  rams_valid BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### inductions
```sql
CREATE TABLE inductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  completed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  certificate_url TEXT,
  
  UNIQUE(project_id, user_id)
);
```

## 3.6 Progress Tables

### programme_activities
```sql
CREATE TABLE programme_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Activity details
  activity_name VARCHAR(255) NOT NULL,
  activity_reference VARCHAR(50),
  zone VARCHAR(100),
  trade VARCHAR(100),
  
  -- Dates
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  
  -- Progress
  percent_complete INTEGER DEFAULT 0, -- 0-100
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'complete', 'delayed'
  rag_status VARCHAR(10) DEFAULT 'grey', -- 'green', 'amber', 'red', 'grey'
  
  -- From uploaded programme
  imported_from_programme BOOLEAN DEFAULT false,
  
  -- Order for display
  display_order INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### progress_updates
```sql
CREATE TABLE progress_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES programme_activities(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  percent_complete INTEGER NOT NULL,
  notes TEXT,
  photos JSONB DEFAULT '[]',
  
  updated_by UUID REFERENCES users(id) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### milestones
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  target_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) DEFAULT 'upcoming', -- 'complete', 'upcoming', 'overdue'
  
  display_order INTEGER,
  show_on_client_portal BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.7 Blockers Table

### blockers
```sql
CREATE TABLE blockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Details
  blocker_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  category VARCHAR(100), -- 'information', 'access', 'material', 'labour', 'weather', 'client', 'design', 'other'
  zone VARCHAR(100),
  trade VARCHAR(100),
  
  -- Impact
  impact_description TEXT,
  days_delayed INTEGER,
  
  -- Assignment
  responsible_party VARCHAR(255),
  
  -- Dates
  date_raised DATE DEFAULT CURRENT_DATE,
  date_due DATE,
  date_resolved DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  is_overdue BOOLEAN DEFAULT false,
  
  -- Resolution
  resolution_notes TEXT,
  
  -- Links
  linked_rfi_id UUID REFERENCES rfis(id),
  linked_diary_id UUID REFERENCES diary_entries(id),
  
  -- Lesson learnt trigger
  lesson_captured BOOLEAN DEFAULT false,
  
  raised_by UUID REFERENCES users(id) NOT NULL,
  resolved_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3.8 Drawings Register

### drawings
```sql
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Drawing info
  drawing_number VARCHAR(100) NOT NULL,
  drawing_title VARCHAR(255) NOT NULL,
  discipline VARCHAR(100), -- 'Architectural', 'Structural', 'M&E', 'Specialist'
  
  -- Current revision
  current_revision VARCHAR(20),
  revision_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'for_construction', -- 'preliminary', 'for_approval', 'for_construction', 'as_built'
  
  -- Expected updates
  next_revision_due DATE,
  is_overdue BOOLEAN DEFAULT false,
  
  -- File (optional - for tracking, not viewing)
  file_url TEXT,
  
  -- Imported flag
  imported_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### drawing_revisions
```sql
CREATE TABLE drawing_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drawing_id UUID REFERENCES drawings(id) NOT NULL,
  
  revision VARCHAR(20) NOT NULL,
  revision_date DATE NOT NULL,
  description TEXT,
  issued_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.9 Reports

### weekly_reports
```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  week_ending DATE NOT NULL,
  report_number INTEGER,
  
  -- Content (AI-generated summaries)
  executive_summary TEXT,
  progress_summary TEXT,
  issues_summary TEXT,
  lookahead_summary TEXT,
  
  -- Stats for that week
  attendance_person_days INTEGER,
  rfis_raised INTEGER,
  rfis_closed INTEGER,
  blockers_raised INTEGER,
  blockers_resolved INTEGER,
  progress_photos_count INTEGER,
  
  -- Overall status
  overall_rag VARCHAR(10),
  
  -- File
  pdf_url TEXT,
  
  -- Publishing
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id),
  
  -- Client visibility
  shared_with_client BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.10 Lessons Learnt

### lessons_learnt
```sql
CREATE TABLE lessons_learnt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  project_id UUID REFERENCES projects(id), -- Source project (optional if manually added)
  
  -- Content
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'design', 'procurement', 'site_management', 'hs', 'commercial', 'handover'
  lesson_type VARCHAR(50), -- 'success', 'improvement', 'risk'
  
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  
  -- Context
  project_type VARCHAR(100),
  client_sector VARCHAR(100),
  building_type VARCHAR(100),
  
  -- Impact
  impact_weeks INTEGER,
  impact_cost DECIMAL(15, 2),
  
  -- Tags
  tags JSONB DEFAULT '[]', -- Array of strings
  
  -- Evidence links
  linked_blocker_id UUID REFERENCES blockers(id),
  linked_rfi_id UUID REFERENCES rfis(id),
  linked_diary_id UUID REFERENCES diary_entries(id),
  
  -- Votes/Usefulness
  vote_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### lesson_votes
```sql
CREATE TABLE lesson_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons_learnt(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lesson_id, user_id)
);
```

## 3.11 Notifications

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Content
  type VARCHAR(100), -- 'overdue_rfi', 'rams_rejected', 'blocker_raised', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Link
  link_type VARCHAR(50), -- 'project', 'rfi', 'rams', 'blocker', etc.
  link_id UUID,
  project_id UUID REFERENCES projects(id),
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# SECTION 4: PAGE STRUCTURE & ROUTES

## 4.1 Public Routes (No Auth)

```
/                           → Marketing landing page
/login                      → Login page (company branded if subdomain)
/signup                     → New company signup
/forgot-password            → Password reset request
/reset-password             → Password reset form
/client/[projectSlug]       → Client portal login
/rams/submit/[token]        → Subcontractor RAMS upload (no login required)
```

## 4.2 Authenticated Routes - Main App

```
/dashboard                  → Main dashboard (role-dependent view)
/projects                   → Projects list
/projects/new               → Create new project (Admin only)
/projects/[id]              → Project detail page (tabbed)
/projects/[id]/settings     → Project settings
/projects/[id]/rfi          → RFI register
/projects/[id]/rfi/new      → Create RFI
/projects/[id]/rfi/[rfiId]  → RFI detail
/projects/[id]/rams         → RAMS register
/projects/[id]/diary        → Daily diary
/projects/[id]/diary/new    → New diary entry (voice)
/projects/[id]/attendance   → Attendance register
/projects/[id]/progress     → Progress tracking
/projects/[id]/blockers     → Blockers register
/projects/[id]/blockers/new → New blocker
/projects/[id]/drawings     → Drawings register
/projects/[id]/reports      → Weekly reports
/projects/[id]/client-portal → Client portal config (PM/Admin only)
/lessons                    → Company-wide lessons learnt
/settings                   → Company settings (Admin only)
/settings/users             → User management
/settings/branding          → White-label settings
/profile                    → User profile
/notifications              → All notifications
```

## 4.3 Mobile/Field Routes

```
/m/signin                   → Mobile site sign-in (geofence + photo)
/m/diary                    → Quick voice diary entry
/m/attendance               → My attendance history
```

---

# SECTION 5: PAGE SPECIFICATIONS

## 5.1 Login Page

**Route:** `/login`

**Components:**
- Company logo (from white-label settings, or Ictus Flow default)
- Email input
- Password input
- "Remember me" checkbox
- "Forgot password" link
- Submit button
- Magic link option ("Email me a login link")

**Subcontractor Login:**
- After login, if user is subcontractor with multiple companies:
  - Show "Select Company" screen with company cards
  - Store selected company in session
  - Show company tabs in header for switching

**Logic:**
```
1. Check if subdomain → load company branding
2. Authenticate via Supabase Auth
3. Fetch user role
4. Redirect based on role:
   - Admin/Director → /dashboard
   - PM/Site Super → /projects (or last visited project)
   - Subcontractor → /projects (their assigned)
   - Client → /client/[projectSlug]
```

---

## 5.2 Main Dashboard

**Route:** `/dashboard`

**Access:** Admin, Director, PM (sees only their projects)

**Purpose:** Single-screen health overview - "Don't phone me" view

### Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Dashboard | Projects | Lessons | Settings | 🔔 👤 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PORTFOLIO HEALTH                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 5        │ │ 3        │ │ 1        │ │ 1        │           │
│  │ Active   │ │ On Track │ │ At Risk  │ │ Critical │           │
│  │ Projects │ │ 🟢       │ │ 🟡       │ │ 🔴       │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ⚠️ ATTENTION REQUIRED (Overdue Items)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 RFI-023 overdue by 3 days - Barnet Court    [View]       ││
│  │ 🔴 RAMS awaiting approval - Smith Drylining   [Review]     ││
│  │ 🟡 Blocker due tomorrow - Material delivery   [View]       ││
│  │ 🟡 3 attendance records need verification     [Verify]     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  📋 PROJECT SUMMARY CARDS                                       │
│  ┌───────────────────┐ ┌───────────────────┐                   │
│  │ Barnet Court      │ │ NHS Wandsworth    │                   │
│  │ 🟡 At Risk        │ │ 🟢 On Track       │                   │
│  │ 67% Complete      │ │ 45% Complete      │                   │
│  │ PC: 14 Feb 2025   │ │ PC: 30 Apr 2025   │                   │
│  │ 2 overdue items   │ │ 0 overdue items   │                   │
│  │ [Open Project]    │ │ [Open Project]    │                   │
│  └───────────────────┘ └───────────────────┘                   │
│                                                                 │
│  📅 UPCOMING THIS WEEK                                          │
│  • Milestone: First Fix Complete (Barnet) - 23 Dec             │
│  • RAMS deadline: Premier Flooring - 22 Dec                    │
│  • Weekly report due: Barnet Court - 21 Dec                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Required:
- All projects for company (Admin/Director) or assigned projects (PM)
- Overdue items aggregated: RFIs, RAMS, Blockers, Attendance verification
- Upcoming items: Milestones, RAMS deadlines, Report due dates
- Overall RAG status per project

### Overdue Logic:
```javascript
// Item is OVERDUE if:
rfi.is_overdue = today > rfi.date_required && rfi.status === 'open'

// Item is WARNING if:
rfi.is_warning = (rfi.date_required - today) <= project.warning_threshold_days && rfi.status === 'open'
```

---

## 5.3 Projects List

**Route:** `/projects`

**Access:** All authenticated users (filtered by permission)

**Components:**
- Filter tabs: All | Active | Complete
- Search bar
- Grid or list view toggle
- Project cards showing:
  - Project name
  - Client name
  - RAG status dot
  - % Complete progress bar
  - Overdue item count (badge)
  - Target completion date
  - Quick action buttons

**Admin sees:** "Create New Project" button

---

## 5.4 Create Project

**Route:** `/projects/new`

**Access:** Admin only

**Multi-step form:**

### Step 1: Basic Information
```
- Project Name *
- Project Reference
- Address *
- Postcode *
- Start Date *
- Target Completion Date *
- Contract Value (optional)
```

### Step 2: Client Details
```
- Client Name *
- Client Contact Name
- Client Contact Email
- Client Sector (dropdown): NHS, MoJ, Education, Commercial, Private, Other
- Project Type (dropdown): Refurbishment, New Build, Fit-out
- Building Type (dropdown): Healthcare, Government, Education, Commercial, Residential
```

### Step 3: Project Risk Profile
```
Enable relevant risks (toggle switches):
[ ] Occupied Building
[ ] Working at Height
[ ] Hot Works
[ ] Live Services
[ ] Asbestos Presence
[ ] Confined Spaces
[ ] Public Interface
[ ] Manual Handling
[ ] Hazardous Substances
[ ] Lifting Operations

Custom Risks:
[+ Add Custom Risk]
- Text input for custom risk description

Scope of Works:
- Upload document (PDF/Word)
- OR paste text directly
```

### Step 4: Settings
```
- RFI Response Days: [7] (default from company settings)
- Warning Threshold Days: [2]
- Enable Client Portal: [Yes/No]
```

### Step 5: Add Users
```
Search existing users or invite new:
- Project Manager * (dropdown of PMs)
- Site Supervisors (multi-select)
- H&S Manager (optional)

[Save & Open Project]
```

---

## 5.5 Project Detail Page

**Route:** `/projects/[id]`

**Access:** Anyone assigned to project

**Layout:** Tabbed interface

```
┌─────────────────────────────────────────────────────────────────┐
│ < Back to Projects                                              │
│                                                                 │
│ BARNET COUNTY COURT REFURBISHMENT                               │
│ 🟡 At Risk | 67% Complete | PC: 14 Feb 2025                    │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [RFIs] [RAMS] [Diary] [Attendance] [Progress]       │
│ [Blockers] [Drawings] [Reports] [Settings*]                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     TAB CONTENT AREA                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
* Settings tab only visible to PM/Admin
```

### Overview Tab (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT SNAPSHOT                                                │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Progress    │ │ RFIs        │ │ RAMS        │ │ Blockers    ││
│ │ 67%         │ │ 5 open      │ │ 2 pending   │ │ 3 active    ││
│ │ [=========] │ │ 2 overdue   │ │ 1 overdue   │ │ 1 critical  ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
│ ⚠️ ATTENTION REQUIRED                                           │
│ • RFI-023: Fire stopping detail (3 days overdue)               │
│ • RAMS: Smith Drylining revision needed                        │
│ • Blocker: Client access to Zone C                             │
│                                                                 │
│ 📅 MILESTONES                                                   │
│ ✓ First Fix Complete - 15 Nov 2024                             │
│ ✓ Second Fix M&E - 20 Dec 2024                                 │
│ ○ Decoration Start - 06 Jan 2025                               │
│ ○ Practical Completion - 14 Feb 2025                           │
│                                                                 │
│ 📸 RECENT PHOTOS (Last 7 days)                                  │
│ [Photo grid - 4 thumbnails with dates]                         │
│                                                                 │
│ 📝 RECENT DIARY ENTRIES                                         │
│ • 21 Dec: Progress update Zone B - Mike T                      │
│ • 20 Dec: Material delivery confirmed - Sarah C                │
│                                                                 │
│ 👷 WHO'S ON SITE TODAY                                          │
│ 12 signed in | 3 pending verification                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.6 RFI Register

**Route:** `/projects/[id]/rfi`

**Access:** All project users (create: PM, Site Super only)

### Components:

**Header:**
- Page title: "RFI Register"
- Stats: X Open | X Responded | X Closed | X Overdue
- Filter dropdowns: Status, Trade, Assigned To
- Search bar
- [+ New RFI] button (if permitted)

**Table columns:**
| RFI # | Subject | Assigned To | Date Raised | Date Required | Status | Actions |
|-------|---------|-------------|-------------|---------------|--------|---------|
| RFI-023 | Fire stopping detail | Architect | 10 Dec | 17 Dec | 🔴 Overdue | View |

**Row styling:**
- Red background tint if overdue
- Amber background tint if warning (due within threshold)

### RFI Detail Page (`/projects/[id]/rfi/[rfiId]`)

```
RFI-023: Fire stopping detail at riser penetrations

Status: 🔴 OVERDUE (3 days)

Raised by: Mike Thompson
Date Raised: 10 December 2024
Date Required: 17 December 2024
Assigned to: ABC Architects (john@abcarch.com)

Trade: Fire Protection
Location: Zone B - Riser locations

Description:
Please confirm fire stopping specification for M&E penetrations 
through the fire-rated riser walls. Drawings show 2-hour rating 
required but no detail for the sealant/collar specification.

Attachments:
📎 Riser_Section_Rev_C.pdf
📎 Site_Photo_001.jpg

---

RESPONSE
[Text area for response]
[Attach files]
[Submit Response] ← Only visible to those with respond permission

---

HISTORY
• 10 Dec 2024 - RFI created by Mike Thompson
• 11 Dec 2024 - Email sent to john@abcarch.com
• 14 Dec 2024 - Reminder sent (3 days remaining)
```

### Create RFI Page (`/projects/[id]/rfi/new`)

```
Form fields:
- Subject * (text)
- Description * (rich text)
- Trade (dropdown)
- Location/Zone (dropdown from project zones)
- Assigned To (text - consultant name)
- Assigned Email (email)
- Date Required * (date picker, default: today + project.rfi_response_days)
- Attachments (file upload, multiple)
- Link to Drawing (dropdown of drawings register)
- Link to Blocker (dropdown of open blockers)

[Cancel] [Create RFI]
```

---

## 5.7 RAMS Management

**Route:** `/projects/[id]/rams`

**Access:** All project users

### Components:

**Header:**
- Stats: X Awaiting | X Under Review | X Revision Required | X Approved
- [+ Add Package] button (PM/Admin)
- [Get Upload Link] button (PM/Admin) - generates subcontractor upload URL

**Table/Cards showing packages:**

| Subcontractor | Package | Status | Deadline | AI Score | Actions |
|---------------|---------|--------|----------|----------|---------|
| ABC Electrical | First & Second Fix | ✅ Approved | - | 92% | View |
| Smith Drylining | Drylining & Ceilings | 🔴 Revision Required | - | 54% | Review |
| Premier Flooring | Floor Finishes | ⏳ Awaiting | 22 Dec | - | Chase |

### RAMS Detail/Review Page

**For PM reviewing a submission:**

```
┌─────────────────────────────────────────────────────────────────┐
│ RAMS REVIEW                                                     │
│ Smith Drylining - Drylining & Ceiling Installation             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Submitted: 19 Dec 2024 | Version: 1                            │
│ AI Review Time: 3 minutes                                       │
│                                                                 │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│ │ AI SCORE                    │ │ STATUS                      ││
│ │ 54%                         │ │ 🔴 REQUIRES REVISION        ││
│ │ [=========>          ]      │ │                             ││
│ └─────────────────────────────┘ └─────────────────────────────┘│
│                                                                 │
│ PROJECT RISK CHECKLIST                                          │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✅ Working at Height    - Covered (fall protection noted)   ││
│ │ ⚠️ Occupied Building    - PARTIAL (no dust suppression)     ││
│ │ ❌ Hot Works            - MISSING (scope includes cutting)  ││
│ │ ✅ Live Services        - Covered                           ││
│ │ ❌ Custom: Silence 9-5  - MISSING                           ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ SCOPE COVERAGE                                                  │
│ 6/8 activities covered                                          │
│ Missing: Cable containment, Final fix accessories              │
│                                                                 │
│ AI RECOMMENDATIONS                                              │
│ 1. Add hot works permit procedure for metal stud cutting       │
│ 2. Include dust suppression measures                           │
│ 3. Specify working hours for noisy activities                  │
│ 4. Add method for cable containment installation               │
│                                                                 │
│ [View Original Document]  [Download AI Report PDF]              │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ PM DECISION                                                     │
│ ○ Approve    ○ Request Revision    ○ Reject                    │
│                                                                 │
│ Comments to Subcontractor:                                      │
│ [Text area]                                                     │
│                                                                 │
│ [Submit Decision]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Subcontractor Upload Portal (No login)

**Route:** `/rams/submit/[token]`

```
┌─────────────────────────────────────────────────────────────────┐
│ [Company Logo]                                                  │
│                                                                 │
│ UPLOAD RAMS                                                     │
│ Barnet County Court Refurbishment                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ YOUR PACKAGE                                                 ││
│ │ Electrical Installation - First & Second Fix                ││
│ │ ABC Electrical Ltd                                          ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ YOUR RAMS MUST ADDRESS THESE RISKS:                            │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔧 Working at Height                                        ││
│ │    Edge protection, rescue plan, PASMA/IPAF certs           ││
│ │                                                              ││
│ │ 🏢 Occupied Building                                        ││
│ │    Noise control, dust suppression, access restrictions     ││
│ │                                                              ││
│ │ ⚡ Live Services                                             ││
│ │    Isolation procedures, permit to work, CAT scanner        ││
│ │                                                              ││
│ │ ⚠️ Court in session - silence required 9am-5pm              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ DEADLINE: 22 December 2024                                     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │                                                              ││
│ │        📄 Drag & drop your RAMS here                        ││
│ │           or click to browse                                 ││
│ │                                                              ││
│ │        PDF or Word (max 25MB)                               ││
│ │                                                              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Your Name: [________________________]                          │
│ Your Email: [________________________]                         │
│                                                                 │
│ [Submit for AI Review]                                         │
│                                                                 │
│ You will receive an analysis report within minutes.            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.8 Daily Diary

**Route:** `/projects/[id]/diary`

**Access:** All project users (create: PM, Site Super)

### Diary List View

```
┌─────────────────────────────────────────────────────────────────┐
│ DAILY DIARY                                     [+ New Entry]   │
│                                                                 │
│ Filter: [All Categories ▼] [All Zones ▼] [Date Range 📅]       │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ 📅 21 December 2024                                             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔧 PROGRESS UPDATE | Zone B | 09:45                         ││
│ │ Mike Thompson                                                ││
│ │                                                              ││
│ │ Checked second fix M&E in zone B. Most areas complete but   ││
│ │ still waiting for fan coil units. Spoke to site foreman     ││
│ │ about cable tray clash - they'll resolve by Thursday.       ││
│ │                                                              ││
│ │ 📷 3 photos | 🔗 RFI-034 linked | 💡 2 AI suggestions       ││
│ │                                                              ││
│ │ AI Sentiment: ⚠️ Concern (mentions waiting/clash)            ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📦 DELIVERY | External | 11:30                              ││
│ │ Sarah Chen                                                   ││
│ │                                                              ││
│ │ Ceiling tiles delivered. 50 packs received, checked against ││
│ │ delivery note. All correct. Stored in Zone A compound.      ││
│ │                                                              ││
│ │ 📷 1 photo                                                   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New Diary Entry (Voice)

**Route:** `/projects/[id]/diary/new`

**Mobile-optimized:**

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW DIARY ENTRY                                                 │
│                                                                 │
│ Category: [Progress ▼]                                         │
│ Zone: [Zone B ▼]                                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │                                                              ││
│ │                    🎤                                        ││
│ │              [HOLD TO RECORD]                                ││
│ │                                                              ││
│ │         ~~~~~~~~ Recording... 0:12 ~~~~~~~~                  ││
│ │                                                              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ TRANSCRIPTION:                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Checked second fix M&E in zone B. Most areas complete but   ││
│ │ still waiting for fan coil units from Acme Mechanical.      ││
│ │ Spoke to site foreman about cable tray clash near the       ││
│ │ riser - they'll sort it by Thursday.                        ││
│ │                                                              ││
│ │ [Edit text if needed]                                       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ PHOTOS:                                                        │
│ [📷 Add Photo]  [Photo1] [Photo2]                              │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ AI ANALYSIS:                                                    │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Entities detected:                                          ││
│ │ • Zone: Zone B                                              ││
│ │ • Trade: M&E                                                ││
│ │ • Subcontractor: Acme Mechanical                            ││
│ │ • Issue: Fan coil units (waiting)                           ││
│ │ • Issue: Cable tray clash (due Thursday)                    ││
│ │                                                              ││
│ │ Related items:                                               ││
│ │ • RFI-034: Riser coordination (Open)                        ││
│ │ • Submittal SUB-089: Fan coil units (Approved 3 weeks ago)  ││
│ │                                                              ││
│ │ Suggested actions:                                           ││
│ │ [✓] Create blocker: Fan coil delivery                       ││
│ │ [✓] Link to RFI-034                                         ││
│ │ [ ] Update progress Zone B                                  ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Cancel]                                     [Save Entry]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.9 Attendance

**Route:** `/projects/[id]/attendance`

**Access:** All project users (verify: PM only)

### Attendance Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ SITE ATTENDANCE                                    [📅 Today ▼] │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ ON SITE     │ │ VERIFIED    │ │ PENDING     │ │ EXPECTED    ││
│ │ 15          │ │ 12          │ │ 3           │ │ 2 not       ││
│ │ 👷          │ │ ✅          │ │ ⏳          │ │ arrived     ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
│ ⚠️ PENDING VERIFICATION                          [Verify All]   │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 👤 John Smith (ABC Electrical) | 07:45 | 📍 ✓ In zone      ││
│ │ [Photo] RAMS: ✅ Induction: ✅                              ││
│ │                                    [Verify] [Dispute]       ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 👤 Mike Jones (Smith Drylining) | 08:02 | 📍 ✓ In zone     ││
│ │ [Photo] RAMS: ❌ Induction: ✅                              ││
│ │                                    [Verify] [Dispute]       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ✅ VERIFIED TODAY                                               │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Name              │ Company         │ In    │ Out   │ Hours ││
│ │ Sarah Chen        │ Site Team       │ 07:00 │ -     │ 5.5h  ││
│ │ Dave Wilson       │ ABC Electrical  │ 07:30 │ -     │ 5.0h  ││
│ │ ...               │                 │       │       │       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ 🔴 EXPECTED BUT NOT ARRIVED                                     │
│ • Premier Flooring (scheduled today per programme)             │
│ • Fire Stopping Ltd (notified arrival for 09:00)              │
│                                     [Send Reminder]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Sign-In Flow

**Route:** `/m/signin`

```
Step 1: Select Project
[Dropdown of user's assigned projects with geofence check]
- Shows distance to site
- Green if within geofence, red if outside

Step 2: Geofence Verification
[Map showing current location vs site boundary]
- Must be within geofence_radius
- If outside: "You must be on site to sign in"

Step 3: Photo Verification
[Camera opens]
- Take selfie
- AI liveness check (blink detection or similar)
- Compare to profile photo

Step 4: Compliance Check (automatic)
- System checks: Induction valid? RAMS approved?
- If failed: "Complete induction first" [Link to induction]

Step 5: Confirmation
"✅ Signed in at 07:45"
[Sign Out] button for later
```

---

## 5.10 Progress Tracking

**Route:** `/projects/[id]/progress`

**Access:** All project users (update: PM, Site Super)

### Components:

**Programme Upload:**
- PM can upload Excel/CSV of programme activities
- AI parses and creates activity list
- Manual add/edit also available

**Progress Dashboard:**

```
┌─────────────────────────────────────────────────────────────────┐
│ PROGRESS TRACKING                                               │
│                                                                 │
│ OVERALL: 67% Complete                    Programme: Uploaded ✓  │
│ [================================================================]│
│                                                                 │
│ PROGRESS BY ZONE                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Zone A      │ │ Zone B      │ │ Zone C      │ │ External    ││
│ │ 🟢 85%      │ │ 🟡 72%      │ │ 🟡 45%      │ │ 🔴 30%      ││
│ │ [========]  │ │ [======]    │ │ [====]      │ │ [==]        ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
│ ACTIVITIES                                    [+ Add Activity]  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Activity          │ Zone   │ Trade │ Plan End │ % │ Status  ││
│ ├───────────────────┼────────┼───────┼──────────┼───┼─────────┤│
│ │ First Fix M&E     │ Zone A │ M&E   │ 30 Nov   │100│ ✅ Done ││
│ │ First Fix M&E     │ Zone B │ M&E   │ 10 Dec   │100│ ✅ Done ││
│ │ Second Fix M&E    │ Zone A │ M&E   │ 20 Dec   │ 90│ 🟢      ││
│ │ Second Fix M&E    │ Zone B │ M&E   │ 05 Jan   │ 65│ 🟡      ││
│ │ Drylining         │ Zone C │ Dry   │ 15 Dec   │ 40│ 🔴 Late ││
│ │ Decoration        │ Zone A │ Dec   │ 10 Jan   │  0│ ⚪ NS   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Quick Update: Click any activity row to update %               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Progress Update Modal:**

```
┌─────────────────────────────────────────────────────────────────┐
│ UPDATE PROGRESS                                                 │
│                                                                 │
│ Activity: Second Fix M&E                                        │
│ Zone: Zone B                                                    │
│                                                                 │
│ Current: 65%                                                    │
│ New:     [75] %                                                │
│          [====================|          ]                     │
│                                                                 │
│ Notes: [Optional notes about this update]                      │
│                                                                 │
│ Photos: [📷 Add]                                                │
│                                                                 │
│ [Cancel]                                          [Save]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.11 Blockers

**Route:** `/projects/[id]/blockers`

**Access:** All project users (create: PM, Site Super | resolve: PM)

### Blockers List

```
┌─────────────────────────────────────────────────────────────────┐
│ BLOCKERS                                       [+ New Blocker]  │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │ 3 OPEN      │ │ 1 CRITICAL  │ │ 2 OVERDUE   │                │
│ └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                 │
│ Filter: [All Status ▼] [All Categories ▼]                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔴 CRITICAL                                                  ││
│ │ BLK-015: Client access to Zone C                            ││
│ │ Category: Access | Due: 22 Dec | Responsible: Client         ││
│ │ Impact: Cannot start decoration until resolved               ││
│ │ Linked: Diary entry 19 Dec                                   ││
│ │                                          [View] [Resolve]    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 🟡 OPEN (Due Tomorrow)                                       ││
│ │ BLK-016: Fan coil unit delivery                              ││
│ │ Category: Material | Due: 22 Dec | Responsible: Acme Mech   ││
│ │                                          [View] [Resolve]    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 🔴 OVERDUE (3 days)                                          ││
│ │ BLK-012: Ceiling void coordination drawing                   ││
│ │ Category: Design | Due: 18 Dec | Responsible: Architect      ││
│ │ Linked: RFI-034                                              ││
│ │                                          [View] [Resolve]    ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ✅ RECENTLY RESOLVED                                            │
│ • BLK-014: Fire stopping specification (Resolved 20 Dec)       │
│ • BLK-011: Power supply confirmation (Resolved 15 Dec)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New Blocker Form

```
Form fields:
- Title * (text)
- Description * (rich text)
- Category * (dropdown): Information, Access, Material, Labour, Weather, Client, Design, Other
- Zone (dropdown)
- Trade (dropdown)
- Responsible Party * (text - who needs to resolve)
- Due Date * (date)
- Impact Description (text)
- Link to RFI (optional dropdown)
- Link to Diary Entry (optional dropdown)
```

### Resolve Blocker Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ RESOLVE BLOCKER                                                 │
│                                                                 │
│ BLK-015: Client access to Zone C                               │
│                                                                 │
│ Resolution Notes: *                                             │
│ [Text area - how was this resolved?]                           │
│                                                                 │
│ Actual Days Delayed: [3]                                       │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ 💡 CAPTURE LESSON LEARNT?                                       │
│ [✓] Yes - this should inform future projects                  │
│                                                                 │
│ If yes:                                                        │
│ Lesson Title: [Early client liaison prevents access issues]   │
│ Recommendation: [Establish single point of contact in week 1] │
│                                                                 │
│ [Cancel]                                    [Resolve Blocker]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.12 Drawings Register

**Route:** `/projects/[id]/drawings`

**Access:** All project users (edit: PM)

### Components:

**Upload:** PM can upload CSV/Excel of drawing register or add manually

```
┌─────────────────────────────────────────────────────────────────┐
│ DRAWINGS REGISTER                    [Upload Register] [+ Add]  │
│                                                                 │
│ Filter: [All Disciplines ▼] [All Status ▼]                     │
│ Search: [Search drawing number or title...]                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Drawing #     │ Title           │ Rev │ Date   │ Status     ││
│ ├───────────────┼─────────────────┼─────┼────────┼────────────┤│
│ │ A-100         │ Ground Floor GA │ C   │ 15 Dec │ ✅ Current ││
│ │ A-101         │ First Floor GA  │ B   │ 10 Dec │ ✅ Current ││
│ │ M-200         │ M&E Layout GF   │ D   │ 18 Dec │ ✅ Current ││
│ │ E-301         │ Lighting Layout │ A   │ 01 Dec │ 🟡 Update  ││
│ │               │                 │     │        │    Expected││
│ │ S-100         │ Foundation Plan │ B   │ 15 Nov │ ✅ Current ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ 📊 Summary: 45 drawings | 3 overdue for update                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Drawing Detail

Shows revision history and linked RFIs

---

## 5.13 Weekly Reports

**Route:** `/projects/[id]/reports`

**Access:** All project users (generate: PM, Admin, Director)

### Reports List

```
┌─────────────────────────────────────────────────────────────────┐
│ WEEKLY REPORTS                              [Generate Report]   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Week Ending    │ Report # │ Status      │ Actions           ││
│ ├────────────────┼──────────┼─────────────┼───────────────────┤│
│ │ 21 Dec 2024    │ WR-012   │ ⏳ Draft    │ [Edit] [Publish]  ││
│ │ 14 Dec 2024    │ WR-011   │ ✅ Published│ [View] [Download] ││
│ │ 07 Dec 2024    │ WR-010   │ ✅ Published│ [View] [Download] ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Generate Report

```
┌─────────────────────────────────────────────────────────────────┐
│ GENERATE WEEKLY REPORT                                          │
│ Week Ending: 21 December 2024                                   │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ 📊 AUTO-POPULATED DATA                                          │
│                                                                 │
│ Attendance: 127 person-days                                    │
│ RFIs Raised: 3 | Closed: 2 | Open: 8                          │
│ Blockers Raised: 2 | Resolved: 1 | Active: 4                  │
│ Progress Photos: 24                                            │
│ Diary Entries: 15                                              │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ 📝 AI-GENERATED SUMMARIES (Edit as needed)                      │
│                                                                 │
│ EXECUTIVE SUMMARY:                                              │
│ [Good progress this week with second fix M&E substantially     │
│ complete in Zones A and B. Decoration preparation underway.   │
│ Main concern remains client access to Zone C.]                 │
│                                                                 │
│ PROGRESS SUMMARY:                                               │
│ [AI-generated from diary entries and progress updates]         │
│                                                                 │
│ KEY ISSUES:                                                     │
│ [AI-generated from blockers and diary concerns]                │
│                                                                 │
│ LOOK AHEAD:                                                     │
│ [AI-generated from upcoming milestones and activities]         │
│                                                                 │
│ OVERALL STATUS: [🟡 Amber ▼]                                    │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ SELECTED PHOTOS FOR REPORT:                                     │
│ [Grid of thumbnails with checkboxes to include]                │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ [Preview PDF]  [Save Draft]  [Publish & Share with Client]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.14 Client Portal Settings

**Route:** `/projects/[id]/client-portal`

**Access:** PM, Admin only

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT PORTAL CONFIGURATION                                     │
│                                                                 │
│ Portal URL: portal.ictusflow.com/barnet-court                  │
│ Status: [✓ Enabled]                                            │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ MODULE VISIBILITY                                               │
│                                                                 │
│ [✓] Programme/Milestones                                       │
│ [✓] Progress Photos (you select which to share)                │
│ [✓] Progress RAG Status                                        │
│ [✓] Weekly Report Summary                                      │
│ [ ] RFI Register                                               │
│     [ ] Show full details  [✓] Show count only                 │
│ [ ] Drawing Register                                           │
│ [✓] Key Risks (you select which to share)                     │
│ [✓] H&S Statistics                                             │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ CLIENT USERS                                         [+ Invite] │
│                                                                 │
│ • John Smith (john@moj.gov.uk) - Client Admin                  │
│ • Sarah Jones (sarah@moj.gov.uk) - Viewer                      │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ BRANDING                                                        │
│ [Use company branding] or [Custom for this project]            │
│                                                                 │
│ Welcome Message:                                                │
│ [Welcome to the Barnet County Court project portal...]         │
│                                                                 │
│ [Save Settings]  [Preview Client View]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.15 Client Portal (External View)

**Route:** `/client/[projectSlug]`

**Access:** Client users only (assigned via client portal settings)

**Layout:** Clean, simplified view with only enabled modules

```
┌─────────────────────────────────────────────────────────────────┐
│ [Contractor Logo]                                     [Logout]  │
│                                                                 │
│ BARNET COUNTY COURT REFURBISHMENT                               │
│ Project Portal                                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Only shows modules enabled in client_portal_settings]         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ PROJECT OVERVIEW                                             ││
│ │ Progress: 67% | Completion: 14 Feb 2025 | Status: On Track  ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ MILESTONES                                                   ││
│ │ [Timeline visualization]                                     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌───────────────────────┐ ┌───────────────────────────────────┐│
│ │ PROGRESS BY AREA      │ │ WEEKLY REPORT                     ││
│ │ [RAG cards]           │ │ Week Ending 21 Dec                ││
│ │                       │ │ [Summary text]                    ││
│ │                       │ │ [Download PDF]                    ││
│ └───────────────────────┘ └───────────────────────────────────┘│
│                                                                 │
│ ┌───────────────────────┐ ┌───────────────────────────────────┐│
│ │ PROGRESS PHOTOS       │ │ HEALTH & SAFETY                   ││
│ │ [Photo gallery]       │ │ 127 Days Without Accident         ││
│ │                       │ │ Inspection Score: 94%             ││
│ └───────────────────────┘ └───────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.16 Lessons Learnt (Company-Wide)

**Route:** `/lessons`

**Access:** All internal users (not subcontractors or clients)

### Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ LESSONS LEARNT                                    [+ Add New]   │
│ Company Knowledge Base                                          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔍 FIND RELEVANT LESSONS                                     ││
│ │                                                              ││
│ │ Describe your project or upload scope document:             ││
│ │ [NHS refurbishment, occupied building, M&E heavy...]        ││
│ │                                                              ││
│ │ [Find Lessons]  or  [Upload Scope Document]                 ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ BROWSE LESSONS                                                  │
│                                                                 │
│ Filter: [All Categories ▼] [All Types ▼] [All Sectors ▼]      │
│ Search: [Search lessons...]                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔴 RISK TO AVOID                                             ││
│ │ Always request asbestos R&D survey before pricing           ││
│ │ Category: Commercial | Sector: Education                    ││
│ │ Impact: 4 weeks, £45,000                                    ││
│ │ Tags: asbestos, tender, risk                                ││
│ │ 👍 15 votes | From: Manchester Education Project            ││
│ │                                              [View Details]  ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 🟢 SUCCESS                                                   ││
│ │ Single point of contact for occupied building access        ││
│ │ Category: Site Management | Sector: Government              ││
│ │ Tags: occupied building, client liaison, MoJ                ││
│ │ 👍 8 votes | From: Birmingham Courts                        ││
│ │                                              [View Details]  ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Lesson Finder

When user enters project description or uploads scope:

```
┌─────────────────────────────────────────────────────────────────┐
│ AI ANALYSIS RESULTS                                             │
│                                                                 │
│ Based on your project profile:                                  │
│ • NHS client                                                   │
│ • Refurbishment                                                │
│ • Occupied building                                            │
│ • M&E heavy                                                    │
│                                                                 │
│ I found 8 highly relevant lessons:                             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 1. NHS projects have 67% higher access restriction delays   ││
│ │    → Establish dedicated liaison role                       ││
│ │                                                              ││
│ │ 2. Occupied building - establish noise working hours early  ││
│ │    → Document in execution plan within week 1               ││
│ │                                                              ││
│ │ 3. M&E coordination issues common with ceiling contractors  ││
│ │    → Request ceiling void coordination drawing upfront      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Export to PDF]  [Add to Project Risk Register]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.17 Company Settings (Admin)

**Route:** `/settings`

**Access:** Admin only

### Tabs:

**General:**
- Company name
- Company logo upload
- Primary/Secondary colours
- Default RFI response days
- Default warning threshold

**Users:**
- User list with roles
- Invite new user
- Edit/Remove users
- Bulk import from CSV

**Branding:**
- Logo settings
- Colour picker
- Custom subdomain config
- Client portal default branding

---

## 5.18 Notifications

**Route:** `/notifications`

**Also:** Bell icon in header shows unread count

```
┌─────────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS                                    [Mark All Read]│
│                                                                 │
│ TODAY                                                           │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔴 RFI-023 is now 3 days overdue                            ││
│ │    Barnet Court | Fire stopping detail                      ││
│ │    2 hours ago                                    [View RFI] ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 📋 RAMS submission requires your review                      ││
│ │    Barnet Court | Smith Drylining                           ││
│ │    4 hours ago                                   [Review]    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ ⚠️ New blocker raised                                        ││
│ │    Barnet Court | Client access to Zone C                   ││
│ │    5 hours ago                                    [View]     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ YESTERDAY                                                       │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✅ RAMS approved                                             ││
│ │    Barnet Court | ABC Electrical                            ││
│ │    Yesterday at 14:30                                       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# SECTION 6: API ENDPOINTS

## 6.1 Authentication

```
POST   /api/auth/login              Login with email/password
POST   /api/auth/magic-link         Send magic link email
POST   /api/auth/logout             Logout
POST   /api/auth/forgot-password    Request password reset
POST   /api/auth/reset-password     Reset password with token
GET    /api/auth/me                 Get current user + permissions
```

## 6.2 Companies

```
GET    /api/companies/:id           Get company details
PUT    /api/companies/:id           Update company settings (Admin)
GET    /api/companies/:id/users     List company users
POST   /api/companies/:id/users     Invite new user (Admin)
DELETE /api/companies/:id/users/:userId  Remove user (Admin)
PUT    /api/companies/:id/branding  Update branding (Admin)
```

## 6.3 Projects

```
GET    /api/projects                List projects (filtered by user access)
POST   /api/projects                Create project (Admin)
GET    /api/projects/:id            Get project details
PUT    /api/projects/:id            Update project
DELETE /api/projects/:id            Archive project (Admin)
GET    /api/projects/:id/dashboard  Get dashboard data for project
GET    /api/projects/:id/users      List project users
POST   /api/projects/:id/users      Add user to project (PM/Admin)
DELETE /api/projects/:id/users/:userId  Remove from project
PUT    /api/projects/:id/risk-profile   Update risk profile
GET    /api/projects/:id/client-settings Get client portal settings
PUT    /api/projects/:id/client-settings Update client portal settings
```

## 6.4 RFIs

```
GET    /api/projects/:id/rfis       List RFIs (with filters)
POST   /api/projects/:id/rfis       Create RFI
GET    /api/projects/:id/rfis/:rfiId    Get RFI detail
PUT    /api/projects/:id/rfis/:rfiId    Update RFI
POST   /api/projects/:id/rfis/:rfiId/respond  Add response
POST   /api/projects/:id/rfis/:rfiId/close    Close RFI
```

## 6.5 RAMS

```
GET    /api/projects/:id/rams           List RAMS packages
POST   /api/projects/:id/rams/packages  Create RAMS package
GET    /api/projects/:id/rams/packages/:pkgId  Get package detail
GET    /api/projects/:id/rams/submissions   List submissions
GET    /api/projects/:id/rams/submissions/:subId  Get submission detail
POST   /api/projects/:id/rams/submissions/:subId/review  PM review decision
POST   /api/projects/:id/rams/upload-link  Generate subcontractor upload URL

# Public (no auth)
POST   /api/rams/submit/:token      Subcontractor upload RAMS
GET    /api/rams/submit/:token      Get package info for upload page
```

## 6.6 AI Analysis

```
POST   /api/ai/analyze-rams         Analyze uploaded RAMS document
POST   /api/ai/transcribe           Transcribe voice recording
POST   /api/ai/analyze-diary        Extract entities from diary text
POST   /api/ai/generate-report      Generate weekly report summaries
POST   /api/ai/find-lessons         Find relevant lessons for project scope
POST   /api/ai/parse-programme      Parse uploaded programme file
```

## 6.7 Daily Diary

```
GET    /api/projects/:id/diary      List diary entries
POST   /api/projects/:id/diary      Create diary entry
GET    /api/projects/:id/diary/:entryId  Get entry detail
PUT    /api/projects/:id/diary/:entryId  Update entry
DELETE /api/projects/:id/diary/:entryId  Delete entry
```

## 6.8 Attendance

```
GET    /api/projects/:id/attendance         List attendance records
POST   /api/projects/:id/attendance/signin  Sign in (with geofence + photo)
POST   /api/projects/:id/attendance/signout Sign out
GET    /api/projects/:id/attendance/today   Today's attendance summary
POST   /api/projects/:id/attendance/:id/verify  Verify attendance (PM)
POST   /api/projects/:id/attendance/:id/dispute Dispute attendance (PM)
```

## 6.9 Progress

```
GET    /api/projects/:id/activities       List programme activities
POST   /api/projects/:id/activities       Create activity
PUT    /api/projects/:id/activities/:actId  Update activity
POST   /api/projects/:id/activities/import  Import from file
POST   /api/projects/:id/activities/:actId/progress  Log progress update
GET    /api/projects/:id/milestones       List milestones
POST   /api/projects/:id/milestones       Create milestone
PUT    /api/projects/:id/milestones/:mId  Update milestone
```

## 6.10 Blockers

```
GET    /api/projects/:id/blockers         List blockers
POST   /api/projects/:id/blockers         Create blocker
GET    /api/projects/:id/blockers/:blkId  Get blocker detail
PUT    /api/projects/:id/blockers/:blkId  Update blocker
POST   /api/projects/:id/blockers/:blkId/resolve  Resolve blocker
```

## 6.11 Drawings

```
GET    /api/projects/:id/drawings         List drawings
POST   /api/projects/:id/drawings         Create drawing
POST   /api/projects/:id/drawings/import  Import from file
PUT    /api/projects/:id/drawings/:drwId  Update drawing
POST   /api/projects/:id/drawings/:drwId/revision  Add revision
```

## 6.12 Reports

```
GET    /api/projects/:id/reports          List weekly reports
POST   /api/projects/:id/reports          Create/generate report
GET    /api/projects/:id/reports/:rptId   Get report detail
PUT    /api/projects/:id/reports/:rptId   Update report
POST   /api/projects/:id/reports/:rptId/publish  Publish report
GET    /api/projects/:id/reports/:rptId/pdf  Download PDF
```

## 6.13 Lessons Learnt

```
GET    /api/lessons                       List lessons (company-wide)
POST   /api/lessons                       Create lesson
GET    /api/lessons/:lessonId             Get lesson detail
PUT    /api/lessons/:lessonId             Update lesson
POST   /api/lessons/:lessonId/vote        Vote for lesson
POST   /api/lessons/search                AI search with scope description
```

## 6.14 Notifications

```
GET    /api/notifications                 List user notifications
PUT    /api/notifications/:id/read        Mark as read
POST   /api/notifications/read-all        Mark all as read
GET    /api/notifications/unread-count    Get unread count
```

## 6.15 Client Portal

```
# Authenticated as client user
GET    /api/client/:projectSlug           Get client portal data
GET    /api/client/:projectSlug/reports   Get published reports
GET    /api/client/:projectSlug/photos    Get shared photos
```

---

# SECTION 7: OVERDUE & NOTIFICATION LOGIC

## 7.1 Overdue Calculations

Run via Supabase Edge Function (cron job) or calculate on read.

```javascript
// RFI Overdue
function isRfiOverdue(rfi) {
  return rfi.status === 'open' && new Date() > new Date(rfi.date_required);
}

function isRfiWarning(rfi, project) {
  const daysRemaining = daysBetween(new Date(), rfi.date_required);
  return rfi.status === 'open' && daysRemaining <= project.warning_threshold_days && daysRemaining > 0;
}

// RAMS Overdue
function isRamsOverdue(package) {
  return package.status === 'awaiting' && package.deadline && new Date() > new Date(package.deadline);
}

// Blocker Overdue
function isBlockerOverdue(blocker) {
  return blocker.status === 'open' && blocker.date_due && new Date() > new Date(blocker.date_due);
}

// Drawing Update Overdue
function isDrawingOverdue(drawing) {
  return drawing.next_revision_due && new Date() > new Date(drawing.next_revision_due);
}

// Attendance Verification Pending
function isAttendancePending(attendance) {
  return attendance.verification_status === 'pending';
}
```

## 7.2 Notification Triggers

| Event | Notification To | Type |
|-------|-----------------|------|
| RFI becomes overdue | PM, Creator | `overdue_rfi` |
| RFI approaching due (warning) | PM, Creator | `warning_rfi` |
| New RFI assigned | Assignee email (external) | Email only |
| RAMS submitted | PM, H&S Manager | `rams_submitted` |
| RAMS AI reviewed | PM | `rams_reviewed` |
| RAMS rejected | Subcontractor | `rams_rejected` |
| RAMS approved | Subcontractor | `rams_approved` |
| New blocker raised | PM, Director (if critical) | `blocker_raised` |
| Blocker becomes overdue | PM | `blocker_overdue` |
| Attendance pending verification | PM | `attendance_pending` |
| User assigned to project | User | `project_assigned` |
| Weekly report published | Client users | `report_published` |

## 7.3 Email Triggers (Minimal)

Only send emails for:
1. Initial user invitation (set password)
2. Subcontractor RAMS feedback (AI report)
3. Weekly report shared with client
4. Password reset

All other notifications are in-app only.

---

# SECTION 8: OFFLINE SUPPORT

## 8.1 Service Worker Strategy

Use Workbox with the following caching:

**Cache First (static assets):**
- CSS, JS, fonts, icons
- Company logo, branding

**Network First (API data):**
- Project list
- RFI list
- Diary entries

**Background Sync (mutations):**
- Diary entry creation (queue if offline)
- Attendance sign-in (queue with timestamp)
- Progress updates

## 8.2 IndexedDB Schema

Store pending mutations locally:

```javascript
// Pending actions store
{
  id: uuid,
  type: 'diary_entry' | 'attendance' | 'progress_update',
  payload: { ... },
  created_at: timestamp,
  synced: false
}
```

When back online:
1. Process queue in order
2. Update UI with server-confirmed data
3. Clear synced items

---

# SECTION 9: AI INTEGRATION SPECIFICATIONS

## 9.1 RAMS Analysis (Claude Opus 4.5)

**Prompt Structure:**

```
You are a construction health and safety expert analyzing a RAMS document.

PROJECT CONTEXT:
- Project: {project_name}
- Scope: {scope_text}
- Enabled Risks: {list of enabled risk categories}
- Custom Risks: {list of custom risks}

RAMS DOCUMENT:
{extracted_text_from_document}

ANALYZE:
1. For each enabled project risk, determine if the RAMS adequately addresses it
2. Check if the RAMS covers all activities mentioned in the scope
3. Identify any missing safety requirements
4. Check for required elements: Emergency procedures, PPE, Training requirements

RESPOND IN JSON:
{
  "overall_score": 0-100,
  "status": "pass" | "minor_issues" | "requires_revision",
  "risk_coverage": [
    {
      "risk_name": "Working at Height",
      "status": "covered" | "partial" | "missing",
      "notes": "Explanation..."
    }
  ],
  "scope_coverage": {
    "activities_covered": 8,
    "activities_total": 10,
    "missing_activities": ["Cable containment", "Final fix"]
  },
  "recommendations": [
    "Add hot works permit procedure",
    "Include dust suppression measures"
  ]
}
```

## 9.2 Voice Transcription

Use OpenAI Whisper API:

```javascript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "en",
  prompt: "Construction site diary. Terms: first fix, second fix, M&E, HVAC, ductwork, riser, soffit, trunking, snagging."
});
```

## 9.3 Diary Analysis (Claude)

```
You are analyzing a construction site diary entry.

PROJECT CONTEXT:
- Zones: {list of zones}
- Trades on site: {list of trades}
- Open RFIs: {list with IDs and subjects}
- Open Blockers: {list with IDs and subjects}

DIARY ENTRY:
"{transcribed_text}"

EXTRACT:
1. Entities mentioned (zones, trades, subcontractors, materials)
2. Any issues or delays mentioned
3. Any progress reported
4. Overall sentiment (positive, neutral, concern)

IDENTIFY LINKS:
- Match any mentioned issues to open RFIs or Blockers

SUGGEST ACTIONS:
- Should a blocker be created?
- Should this link to an RFI?
- Should progress be updated?

RESPOND IN JSON:
{
  "entities": {
    "zones": ["Zone B"],
    "trades": ["M&E"],
    "subcontractors": ["Acme Mechanical"],
    "materials": ["fan coil units"]
  },
  "issues": [
    {"description": "Waiting for fan coil units", "severity": "medium"},
    {"description": "Cable tray clash", "severity": "low"}
  ],
  "sentiment": "concern",
  "linked_rfis": ["RFI-034"],
  "suggested_actions": [
    {"type": "create_blocker", "title": "Fan coil delivery delay"},
    {"type": "link_rfi", "rfi_id": "RFI-034"}
  ]
}
```

## 9.4 Report Generation (Claude)

```
Generate a weekly construction report summary.

PROJECT: {project_name}
WEEK ENDING: {date}

DATA:
- Diary entries this week: {list of entries}
- Blockers raised/resolved: {counts and titles}
- RFIs raised/closed: {counts}
- Progress updates: {list}
- Attendance: {person-days}

Generate:
1. EXECUTIVE SUMMARY (2-3 sentences, overall status)
2. PROGRESS SUMMARY (what was achieved, which zones, key completions)
3. KEY ISSUES (blockers, delays, concerns from diaries)
4. LOOK AHEAD (upcoming milestones, planned activities)

Keep language professional but concise. Use construction terminology.
```

## 9.5 Lessons Learnt Search (Claude)

```
You are matching lessons learnt to a project scope.

PROJECT SCOPE:
{scope_text_or_description}

AVAILABLE LESSONS:
{JSON array of all lessons with title, description, tags, sector, project_type}

Find the most relevant lessons for this project.
Consider: sector match, project type match, risk similarities, trade overlaps.

Return top 10 most relevant lessons with explanation of relevance.
```

---

# SECTION 10: FILE STRUCTURE

```
ictus-flow/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── rfi/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [rfiId]/
│   │   │       │       └── page.tsx
│   │   │       ├── rams/
│   │   │       │   └── page.tsx
│   │   │       ├── diary/
│   │   │       │   ├── page.tsx
│   │   │       │   └── new/
│   │   │       │       └── page.tsx
│   │   │       ├── attendance/
│   │   │       │   └── page.tsx
│   │   │       ├── progress/
│   │   │       │   └── page.tsx
│   │   │       ├── blockers/
│   │   │       │   ├── page.tsx
│   │   │       │   └── new/
│   │   │       │       └── page.tsx
│   │   │       ├── drawings/
│   │   │       │   └── page.tsx
│   │   │       ├── reports/
│   │   │       │   └── page.tsx
│   │   │       ├── client-portal/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   ├── lessons/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── branding/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (mobile)/
│   │   ├── m/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── diary/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (public)/
│   │   ├── rams/
│   │   │   └── submit/
│   │   │       └── [token]/
│   │   │           └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (client)/
│   │   ├── client/
│   │   │   └── [projectSlug]/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── ...
│   │   ├── companies/
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── users/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── rfis/route.ts
│   │   │       ├── rams/route.ts
│   │   │       ├── diary/route.ts
│   │   │       ├── attendance/route.ts
│   │   │       ├── activities/route.ts
│   │   │       ├── blockers/route.ts
│   │   │       ├── drawings/route.ts
│   │   │       ├── reports/route.ts
│   │   │       └── ...
│   │   ├── ai/
│   │   │   ├── analyze-rams/route.ts
│   │   │   ├── transcribe/route.ts
│   │   │   ├── analyze-diary/route.ts
│   │   │   ├── generate-report/route.ts
│   │   │   ├── find-lessons/route.ts
│   │   │   └── parse-programme/route.ts
│   │   ├── lessons/
│   │   │   └── route.ts
│   │   ├── notifications/
│   │   │   └── route.ts
│   │   ├── rams/
│   │   │   └── submit/
│   │   │       └── [token]/route.ts
│   │   └── client/
│   │       └── [projectSlug]/route.ts
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── NotificationBell.tsx
│   ├── dashboard/
│   │   ├── PortfolioHealth.tsx
│   │   ├── AttentionRequired.tsx
│   │   ├── ProjectCard.tsx
│   │   └── UpcomingItems.tsx
│   ├── projects/
│   │   ├── ProjectHeader.tsx
│   │   ├── ProjectTabs.tsx
│   │   ├── OverviewTab.tsx
│   │   └── ...
│   ├── rfi/
│   │   ├── RfiList.tsx
│   │   ├── RfiDetail.tsx
│   │   ├── RfiForm.tsx
│   │   └── RfiStatusBadge.tsx
│   ├── rams/
│   │   ├── RamsPackageList.tsx
│   │   ├── RamsReview.tsx
│   │   ├── RamsUploadPortal.tsx
│   │   └── AiAnalysisDisplay.tsx
│   ├── diary/
│   │   ├── DiaryList.tsx
│   │   ├── DiaryEntry.tsx
│   │   ├── VoiceRecorder.tsx
│   │   └── AiSuggestions.tsx
│   ├── attendance/
│   │   ├── AttendanceDashboard.tsx
│   │   ├── SignInFlow.tsx
│   │   ├── GeofenceCheck.tsx
│   │   └── PhotoVerification.tsx
│   ├── progress/
│   │   ├── ProgressDashboard.tsx
│   │   ├── ActivityList.tsx
│   │   ├── ProgressUpdateModal.tsx
│   │   └── ZoneCards.tsx
│   ├── blockers/
│   │   ├── BlockerList.tsx
│   │   ├── BlockerForm.tsx
│   │   └── ResolveModal.tsx
│   ├── reports/
│   │   ├── ReportList.tsx
│   │   ├── ReportGenerator.tsx
│   │   └── ReportPreview.tsx
│   ├── client-portal/
│   │   ├── PortalConfig.tsx
│   │   ├── ClientDashboard.tsx
│   │   └── ModuleWidgets.tsx
│   └── lessons/
│       ├── LessonsList.tsx
│       ├── LessonCard.tsx
│       ├── LessonForm.tsx
│       └── AiLessonFinder.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── claude.ts
│   │   └── whisper.ts
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── permissions.ts
│   │   └── overdue.ts
│   └── hooks/
│       ├── useProject.ts
│       ├── useNotifications.ts
│       ├── useGeolocation.ts
│       └── useOffline.ts
│
├── types/
│   ├── database.ts          # Generated from Supabase
│   ├── api.ts
│   └── index.ts
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── cron-overdue-check/
│           └── index.ts
│
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

# SECTION 11: IMPLEMENTATION ORDER

## Phase 1: Foundation (Week 1)
1. Set up Next.js project with TypeScript
2. Configure Supabase (database, auth, storage)
3. Create database migrations (all tables)
4. Set up Tailwind + shadcn/ui
5. Build authentication flow (login, signup, magic link)
6. Build layout (header, sidebar, navigation)
7. Implement role-based middleware

## Phase 2: Core Project Management (Week 1-2)
8. Company settings page
9. User management
10. Projects list page
11. Create project flow (multi-step form)
12. Project detail page with tabs
13. Project overview tab

## Phase 3: RFI & RAMS (Week 2)
14. RFI list page
15. Create RFI form
16. RFI detail page
17. RFI response flow
18. Overdue calculation + display
19. RAMS packages list
20. RAMS upload portal (public)
21. AI RAMS analysis integration
22. RAMS review page

## Phase 4: Daily Operations (Week 2-3)
23. Daily diary list
24. Voice recording component
25. Whisper transcription integration
26. AI diary analysis
27. New diary entry page
28. Attendance dashboard
29. Mobile sign-in flow (geofence + photo)
30. Attendance verification

## Phase 5: Progress & Blockers (Week 3)
31. Programme activities list
32. Programme import (CSV/Excel)
33. AI programme parsing
34. Progress update modal
35. Zone RAG cards
36. Blockers list
37. Create blocker form
38. Resolve blocker with lesson capture

## Phase 6: Drawings & Reports (Week 3)
39. Drawings register
40. Drawings import
41. Weekly reports list
42. Report generator (AI summaries)
43. Report PDF generation
44. Report publishing

## Phase 7: Client Portal (Week 4)
45. Client portal settings page
46. Client user invitation
47. Client login flow
48. Client dashboard (filtered modules)

## Phase 8: Lessons Learnt (Week 4)
49. Lessons list page
50. Add lesson form
51. AI lesson finder
52. Scope document upload + matching

## Phase 9: Notifications & Polish (Week 4)
53. Notifications page
54. In-app notification system
55. Notification bell with count
56. Overdue cron job (Edge Function)
57. PWA configuration
58. Offline support (Service Worker)

## Phase 10: Final (Week 4)
59. White-label branding
60. Mobile optimisation
61. Testing & bug fixes
62. Documentation

---

# SECTION 12: ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://app.ictusflow.com
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://portal.ictusflow.com

# Email (optional - for sending)
RESEND_API_KEY=
```

---

# END OF IMPLEMENTATION PLAN

This document provides Claude Code with everything needed to build Ictus Flow:
- Complete database schema
- All pages with layouts and content specifications
- All API endpoints
- User permissions
- AI integration prompts
- File structure
- Implementation order

Total estimated time: 4 weeks for full implementation, 1 week for MVP core features.
