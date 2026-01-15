-- Cleanup script - run this before 002_add_missing_rls_policies.sql
-- This drops any policies that may have been partially created

-- project_users
DROP POLICY IF EXISTS "Project members can view project users" ON project_users;
DROP POLICY IF EXISTS "Admins can insert project users" ON project_users;
DROP POLICY IF EXISTS "Admins can update project users" ON project_users;
DROP POLICY IF EXISTS "Admins can delete project users" ON project_users;
DROP POLICY IF EXISTS "Service role has full access to project_users" ON project_users;

-- subcontractor_companies
DROP POLICY IF EXISTS "Users can view subcontractor companies in their company" ON subcontractor_companies;
DROP POLICY IF EXISTS "Admins can manage subcontractor companies" ON subcontractor_companies;
DROP POLICY IF EXISTS "Admins can update subcontractor companies" ON subcontractor_companies;
DROP POLICY IF EXISTS "Admins can delete subcontractor companies" ON subcontractor_companies;
DROP POLICY IF EXISTS "Service role has full access to subcontractor_companies" ON subcontractor_companies;

-- project_risk_profiles
DROP POLICY IF EXISTS "Project members can view risk profiles" ON project_risk_profiles;
DROP POLICY IF EXISTS "PMs can manage risk profiles" ON project_risk_profiles;
DROP POLICY IF EXISTS "PMs can update risk profiles" ON project_risk_profiles;
DROP POLICY IF EXISTS "Service role has full access to project_risk_profiles" ON project_risk_profiles;

-- client_portal_settings
DROP POLICY IF EXISTS "Project members can view client portal settings" ON client_portal_settings;
DROP POLICY IF EXISTS "PMs can manage client portal settings" ON client_portal_settings;
DROP POLICY IF EXISTS "PMs can update client portal settings" ON client_portal_settings;
DROP POLICY IF EXISTS "Service role has full access to client_portal_settings" ON client_portal_settings;

-- diary_entries
DROP POLICY IF EXISTS "Project members can view diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Project members can create diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can update their own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete their own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Service role has full access to diary_entries" ON diary_entries;

-- site_attendance
DROP POLICY IF EXISTS "Users can view own attendance" ON site_attendance;
DROP POLICY IF EXISTS "Users can create own attendance" ON site_attendance;
DROP POLICY IF EXISTS "Users can update own attendance or PMs can verify" ON site_attendance;
DROP POLICY IF EXISTS "Service role has full access to site_attendance" ON site_attendance;

-- inductions
DROP POLICY IF EXISTS "Users can view own inductions" ON inductions;
DROP POLICY IF EXISTS "HS managers can create inductions" ON inductions;
DROP POLICY IF EXISTS "HS managers can update inductions" ON inductions;
DROP POLICY IF EXISTS "Service role has full access to inductions" ON inductions;

-- programme_activities
DROP POLICY IF EXISTS "Project members can view activities" ON programme_activities;
DROP POLICY IF EXISTS "PMs can create activities" ON programme_activities;
DROP POLICY IF EXISTS "PMs can update activities" ON programme_activities;
DROP POLICY IF EXISTS "PMs can delete activities" ON programme_activities;
DROP POLICY IF EXISTS "Service role has full access to programme_activities" ON programme_activities;

-- progress_updates
DROP POLICY IF EXISTS "Project members can view progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Project members can create progress updates" ON progress_updates;
DROP POLICY IF EXISTS "PMs can update progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Service role has full access to progress_updates" ON progress_updates;

-- milestones
DROP POLICY IF EXISTS "Project members can view milestones" ON milestones;
DROP POLICY IF EXISTS "PMs can create milestones" ON milestones;
DROP POLICY IF EXISTS "PMs can update milestones" ON milestones;
DROP POLICY IF EXISTS "PMs can delete milestones" ON milestones;
DROP POLICY IF EXISTS "Service role has full access to milestones" ON milestones;

-- blockers
DROP POLICY IF EXISTS "Project members can view blockers" ON blockers;
DROP POLICY IF EXISTS "Project members can create blockers" ON blockers;
DROP POLICY IF EXISTS "Project members can update blockers" ON blockers;
DROP POLICY IF EXISTS "PMs can delete blockers" ON blockers;
DROP POLICY IF EXISTS "Service role has full access to blockers" ON blockers;

-- drawings
DROP POLICY IF EXISTS "Project members can view drawings" ON drawings;
DROP POLICY IF EXISTS "PMs can create drawings" ON drawings;
DROP POLICY IF EXISTS "PMs can update drawings" ON drawings;
DROP POLICY IF EXISTS "PMs can delete drawings" ON drawings;
DROP POLICY IF EXISTS "Service role has full access to drawings" ON drawings;

-- drawing_revisions
DROP POLICY IF EXISTS "Project members can view drawing revisions" ON drawing_revisions;
DROP POLICY IF EXISTS "PMs can create drawing revisions" ON drawing_revisions;
DROP POLICY IF EXISTS "PMs can update drawing revisions" ON drawing_revisions;
DROP POLICY IF EXISTS "Service role has full access to drawing_revisions" ON drawing_revisions;

-- weekly_reports
DROP POLICY IF EXISTS "Project members can view weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "PMs can create weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "PMs can update weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "PMs can delete weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "Service role has full access to weekly_reports" ON weekly_reports;

-- lesson_votes
DROP POLICY IF EXISTS "Users can view votes on company lessons" ON lesson_votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON lesson_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON lesson_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON lesson_votes;
DROP POLICY IF EXISTS "Service role has full access to lesson_votes" ON lesson_votes;

-- Additional policies
DROP POLICY IF EXISTS "PMs can delete RFIs" ON rfis;
DROP POLICY IF EXISTS "Users can update their own lessons" ON lessons_learnt;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON lessons_learnt;
