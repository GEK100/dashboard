-- Ictus Flow - Complete Database Schema
-- Multi-tenant Construction Intelligence Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECTION 1: CORE TABLES
-- ============================================

-- Companies (Tenants)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1B4F72',
  secondary_color VARCHAR(7) DEFAULT '#2874A6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Settings
  default_rfi_days INTEGER DEFAULT 7,
  default_warning_days INTEGER DEFAULT 2,
  client_portal_enabled BOOLEAN DEFAULT true
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  is_subcontractor BOOLEAN DEFAULT false,
  is_client BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,

  -- For biometric verification (Phase 2)
  profile_photo_url TEXT,

  -- Notification preferences
  notify_overdue BOOLEAN DEFAULT true,
  notify_assigned BOOLEAN DEFAULT true,

  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'director', 'pm', 'site_super', 'qs', 'hs', 'viewer'))
);

-- Subcontractor-Company relationships (many-to-many)
CREATE TABLE subcontractor_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  trade VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- ============================================
-- SECTION 2: PROJECT TABLES
-- ============================================

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  reference VARCHAR(100),
  address TEXT,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius INTEGER DEFAULT 100,

  -- Dates
  start_date DATE,
  target_completion DATE,
  actual_completion DATE,

  -- Value
  contract_value DECIMAL(15, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'live',

  -- Settings
  rfi_response_days INTEGER DEFAULT 7,
  warning_threshold_days INTEGER DEFAULT 2,

  -- Client Info
  client_name VARCHAR(255),
  client_contact_name VARCHAR(255),
  client_contact_email VARCHAR(255),
  client_sector VARCHAR(100),

  -- Project Type
  project_type VARCHAR(100),
  building_type VARCHAR(100),

  -- Hero Image
  hero_image_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  CONSTRAINT valid_status CHECK (status IN ('live', 'practical_completion', 'defects', 'closed'))
);

-- Project Risk Profile
CREATE TABLE project_risk_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Standard Risks
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

  -- Scope of Works
  scope_document_url TEXT,
  scope_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Users (many-to-many with role per project)
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id),
  UNIQUE(project_id, user_id),

  CONSTRAINT valid_project_role CHECK (role IN ('pm', 'site_super', 'qs', 'hs', 'viewer', 'subcontractor', 'client'))
);

-- Client Portal Settings
CREATE TABLE client_portal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Module visibility
  show_programme BOOLEAN DEFAULT true,
  show_progress_photos BOOLEAN DEFAULT true,
  show_rag_status BOOLEAN DEFAULT true,
  show_weekly_report BOOLEAN DEFAULT true,
  show_rfi_register BOOLEAN DEFAULT false,
  show_rfi_count_only BOOLEAN DEFAULT true,
  show_drawing_register BOOLEAN DEFAULT false,
  show_key_risks BOOLEAN DEFAULT false,
  show_hs_stats BOOLEAN DEFAULT true,

  -- Custom welcome message
  welcome_message TEXT,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECTION 3: RFI TABLES
-- ============================================

CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  rfi_number INTEGER NOT NULL,
  reference VARCHAR(50),

  -- Content
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  trade VARCHAR(100),

  -- Assignment
  assigned_to VARCHAR(255),
  assigned_to_email VARCHAR(255),

  -- Dates
  date_raised DATE DEFAULT CURRENT_DATE,
  date_required DATE NOT NULL,
  date_responded DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'open',
  is_overdue BOOLEAN DEFAULT false,

  -- Response
  response TEXT,
  response_by VARCHAR(255),

  -- Attachments
  attachments JSONB DEFAULT '[]',
  response_attachments JSONB DEFAULT '[]',

  -- Linked items
  linked_drawing_id UUID,
  linked_blocker_id UUID,

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_rfi_status CHECK (status IN ('open', 'responded', 'closed'))
);

-- ============================================
-- SECTION 4: RAMS TABLES
-- ============================================

-- RAMS Packages (expected submissions)
CREATE TABLE rams_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  subcontractor_id UUID REFERENCES user_profiles(id),
  package_name VARCHAR(255) NOT NULL,
  scope_description TEXT,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'awaiting',
  upload_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_package_status CHECK (status IN ('awaiting', 'submitted', 'approved'))
);

-- RAMS Submissions
CREATE TABLE rams_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES rams_packages(id) ON DELETE CASCADE,

  -- Subcontractor
  subcontractor_id UUID REFERENCES user_profiles(id),
  subcontractor_company VARCHAR(255),
  package_name VARCHAR(255),

  -- Document
  document_url TEXT NOT NULL,
  document_name VARCHAR(255),
  version INTEGER DEFAULT 1,

  -- Submission
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by_name VARCHAR(255),
  submitted_by_email VARCHAR(255),

  -- AI Analysis (Phase 2)
  ai_score INTEGER,
  ai_status VARCHAR(50),
  ai_analysis JSONB,
  ai_reviewed_at TIMESTAMP WITH TIME ZONE,

  -- PM Review
  pm_status VARCHAR(50) DEFAULT 'pending',
  pm_comments TEXT,
  pm_reviewed_at TIMESTAMP WITH TIME ZONE,
  pm_reviewed_by UUID REFERENCES user_profiles(id),

  -- Feedback
  feedback_sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_ai_status CHECK (ai_status IS NULL OR ai_status IN ('pass', 'minor_issues', 'requires_revision')),
  CONSTRAINT valid_pm_status CHECK (pm_status IN ('pending', 'approved', 'rejected', 'revision_required'))
);

-- Update rams_packages to reference current submission
ALTER TABLE rams_packages ADD COLUMN current_submission_id UUID REFERENCES rams_submissions(id);

-- ============================================
-- SECTION 5: DAILY DIARY TABLES
-- ============================================

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Entry details
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_time TIME DEFAULT CURRENT_TIME,

  -- Content
  category VARCHAR(50),
  content TEXT NOT NULL,
  original_audio_url TEXT,

  -- Location/Context
  zone VARCHAR(100),
  location_description VARCHAR(255),
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),

  -- Photos
  photos JSONB DEFAULT '[]',

  -- AI Analysis (Phase 2)
  ai_entities JSONB,
  ai_suggestions JSONB,
  ai_linked_rfis JSONB,
  ai_linked_blockers JSONB,
  ai_sentiment VARCHAR(50),

  -- Author
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IS NULL OR category IN ('progress', 'issue', 'instruction', 'visitor', 'hs', 'weather', 'delivery', 'general')),
  CONSTRAINT valid_sentiment CHECK (ai_sentiment IS NULL OR ai_sentiment IN ('positive', 'neutral', 'concern'))
);

-- ============================================
-- SECTION 6: ATTENDANCE TABLES
-- ============================================

CREATE TABLE site_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Sign in
  sign_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sign_in_latitude DECIMAL(10, 8),
  sign_in_longitude DECIMAL(11, 8),
  sign_in_photo_url TEXT,
  sign_in_verified BOOLEAN DEFAULT false,

  -- Sign out
  sign_out_time TIMESTAMP WITH TIME ZONE,
  sign_out_latitude DECIMAL(10, 8),
  sign_out_longitude DECIMAL(11, 8),
  auto_sign_out BOOLEAN DEFAULT false,

  -- Verification
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  dispute_reason TEXT,

  -- Induction check
  induction_valid BOOLEAN DEFAULT false,
  rams_valid BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'disputed'))
);

CREATE TABLE inductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,

  UNIQUE(project_id, user_id)
);

-- ============================================
-- SECTION 7: PROGRESS TABLES
-- ============================================

CREATE TABLE programme_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

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
  percent_complete INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'not_started',
  rag_status VARCHAR(10) DEFAULT 'grey',

  -- Import flag
  imported_from_programme BOOLEAN DEFAULT false,

  -- Display order
  display_order INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_activity_status CHECK (status IN ('not_started', 'in_progress', 'complete', 'delayed')),
  CONSTRAINT valid_rag CHECK (rag_status IN ('green', 'amber', 'red', 'grey')),
  CONSTRAINT valid_percent CHECK (percent_complete >= 0 AND percent_complete <= 100)
);

CREATE TABLE progress_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES programme_activities(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  percent_complete INTEGER NOT NULL,
  notes TEXT,
  photos JSONB DEFAULT '[]',

  updated_by UUID REFERENCES user_profiles(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_percent CHECK (percent_complete >= 0 AND percent_complete <= 100)
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(255) NOT NULL,
  target_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) DEFAULT 'upcoming',

  display_order INTEGER,
  show_on_client_portal BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_milestone_status CHECK (status IN ('complete', 'upcoming', 'overdue'))
);

-- ============================================
-- SECTION 8: BLOCKERS TABLE
-- ============================================

CREATE TABLE blockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Details
  blocker_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Classification
  category VARCHAR(100),
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
  status VARCHAR(50) DEFAULT 'open',
  is_overdue BOOLEAN DEFAULT false,

  -- Resolution
  resolution_notes TEXT,

  -- Links
  linked_rfi_id UUID REFERENCES rfis(id),
  linked_diary_id UUID REFERENCES diary_entries(id),

  -- Lesson learnt trigger
  lesson_captured BOOLEAN DEFAULT false,

  raised_by UUID REFERENCES user_profiles(id) NOT NULL,
  resolved_by UUID REFERENCES user_profiles(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_blocker_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_blocker_category CHECK (category IS NULL OR category IN ('information', 'access', 'material', 'labour', 'weather', 'client', 'design', 'other'))
);

-- ============================================
-- SECTION 9: DRAWINGS REGISTER
-- ============================================

CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Drawing info
  drawing_number VARCHAR(100) NOT NULL,
  drawing_title VARCHAR(255) NOT NULL,
  discipline VARCHAR(100),

  -- Current revision
  current_revision VARCHAR(20),
  revision_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'for_construction',

  -- Expected updates
  next_revision_due DATE,
  is_overdue BOOLEAN DEFAULT false,

  -- File
  file_url TEXT,

  -- Import flag
  imported_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_drawing_status CHECK (status IN ('preliminary', 'for_approval', 'for_construction', 'as_built'))
);

CREATE TABLE drawing_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE NOT NULL,

  revision VARCHAR(20) NOT NULL,
  revision_date DATE NOT NULL,
  description TEXT,
  issued_by VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECTION 10: REPORTS
-- ============================================

CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  week_ending DATE NOT NULL,
  report_number INTEGER,

  -- Content
  executive_summary TEXT,
  progress_summary TEXT,
  issues_summary TEXT,
  lookahead_summary TEXT,

  -- Stats
  attendance_person_days INTEGER,
  rfis_raised INTEGER,
  rfis_closed INTEGER,
  blockers_raised INTEGER,
  blockers_resolved INTEGER,
  progress_photos_count INTEGER,

  -- Overall status
  overall_rag VARCHAR(10),

  -- Selected photos for report
  selected_photos JSONB DEFAULT '[]',

  -- File
  pdf_url TEXT,

  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID REFERENCES user_profiles(id),

  -- Client visibility
  shared_with_client BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_report_rag CHECK (overall_rag IS NULL OR overall_rag IN ('green', 'amber', 'red'))
);

-- ============================================
-- SECTION 11: LESSONS LEARNT
-- ============================================

CREATE TABLE lessons_learnt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id),

  -- Content
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  lesson_type VARCHAR(50),

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
  tags JSONB DEFAULT '[]',

  -- Evidence links
  linked_blocker_id UUID REFERENCES blockers(id),
  linked_rfi_id UUID REFERENCES rfis(id),
  linked_diary_id UUID REFERENCES diary_entries(id),

  -- Votes
  vote_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_lesson_category CHECK (category IS NULL OR category IN ('design', 'procurement', 'site_management', 'hs', 'commercial', 'handover')),
  CONSTRAINT valid_lesson_type CHECK (lesson_type IS NULL OR lesson_type IN ('success', 'improvement', 'risk'))
);

CREATE TABLE lesson_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons_learnt(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, user_id)
);

-- ============================================
-- SECTION 12: NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Content
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,

  -- Link
  link_type VARCHAR(50),
  link_id UUID,
  project_id UUID REFERENCES projects(id),

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECTION 13: INDEXES
-- ============================================

-- Company lookups
CREATE INDEX idx_companies_slug ON companies(slug);

-- User lookups
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Project lookups
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Project users
CREATE INDEX idx_project_users_project ON project_users(project_id);
CREATE INDEX idx_project_users_user ON project_users(user_id);

-- RFIs
CREATE INDEX idx_rfis_project ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE INDEX idx_rfis_overdue ON rfis(is_overdue) WHERE is_overdue = true;

-- RAMS
CREATE INDEX idx_rams_packages_project ON rams_packages(project_id);
CREATE INDEX idx_rams_packages_token ON rams_packages(upload_token);
CREATE INDEX idx_rams_submissions_project ON rams_submissions(project_id);

-- Diary
CREATE INDEX idx_diary_entries_project ON diary_entries(project_id);
CREATE INDEX idx_diary_entries_date ON diary_entries(entry_date);

-- Attendance
CREATE INDEX idx_site_attendance_project ON site_attendance(project_id);
CREATE INDEX idx_site_attendance_user ON site_attendance(user_id);
CREATE INDEX idx_site_attendance_date ON site_attendance(sign_in_time);

-- Progress
CREATE INDEX idx_programme_activities_project ON programme_activities(project_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);

-- Blockers
CREATE INDEX idx_blockers_project ON blockers(project_id);
CREATE INDEX idx_blockers_status ON blockers(status);
CREATE INDEX idx_blockers_overdue ON blockers(is_overdue) WHERE is_overdue = true;

-- Drawings
CREATE INDEX idx_drawings_project ON drawings(project_id);

-- Reports
CREATE INDEX idx_weekly_reports_project ON weekly_reports(project_id);

-- Lessons
CREATE INDEX idx_lessons_learnt_company ON lessons_learnt(company_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ============================================
-- SECTION 14: FUNCTIONS
-- ============================================

-- Auto-increment RFI number per project
CREATE OR REPLACE FUNCTION get_next_rfi_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(rfi_number), 0) + 1 INTO next_num
  FROM rfis
  WHERE project_id = p_project_id;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-increment blocker number per project
CREATE OR REPLACE FUNCTION get_next_blocker_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(blocker_number), 0) + 1 INTO next_num
  FROM blockers
  WHERE project_id = p_project_id;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Update lesson vote count
CREATE OR REPLACE FUNCTION update_lesson_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lessons_learnt SET vote_count = vote_count + 1 WHERE id = NEW.lesson_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lessons_learnt SET vote_count = vote_count - 1 WHERE id = OLD.lesson_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lesson_votes
AFTER INSERT OR DELETE ON lesson_votes
FOR EACH ROW EXECUTE FUNCTION update_lesson_vote_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_risk_profiles_updated_at BEFORE UPDATE ON project_risk_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfis_updated_at BEFORE UPDATE ON rfis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programme_activities_updated_at BEFORE UPDATE ON programme_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blockers_updated_at BEFORE UPDATE ON blockers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drawings_updated_at BEFORE UPDATE ON drawings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECTION 15: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rams_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rams_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learnt ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view profiles in same company" ON user_profiles FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

-- Companies policies
CREATE POLICY "Users can view own company" ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can update own company" ON companies FOR UPDATE
  USING (id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Projects policies
CREATE POLICY "Users can view projects in company" ON projects FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can create projects" ON projects FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "PMs and Admins can update projects" ON projects FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
    OR id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

-- Project-level data policies (rfis, diary, blockers, etc.)
-- These allow access to users assigned to the project
CREATE POLICY "Project members can view RFIs" ON rfis FOR SELECT
  USING (project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))));

CREATE POLICY "PMs and Site Supers can create RFIs" ON rfis FOR INSERT
  WITH CHECK (project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super')));

CREATE POLICY "PMs can update RFIs" ON rfis FOR UPDATE
  USING (project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm'));

-- Notifications - users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Lessons learnt - company-wide access
CREATE POLICY "Users can view company lessons" ON lessons_learnt FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create lessons" ON lessons_learnt FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

-- Service role bypass for all tables (for backend operations)
CREATE POLICY "Service role has full access to companies" ON companies FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to user_profiles" ON user_profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to projects" ON projects FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to rfis" ON rfis FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to rams_packages" ON rams_packages FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to rams_submissions" ON rams_submissions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role has full access to notifications" ON notifications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
