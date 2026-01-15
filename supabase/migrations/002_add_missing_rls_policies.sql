-- ============================================
-- Migration: Add Missing RLS Policies
-- Date: 2024
-- Description: Adds RLS policies for all tables that were missing them
-- ============================================

-- ============================================
-- PROJECT_USERS POLICIES
-- ============================================

-- Users can view project users for projects they are assigned to
CREATE POLICY "Project members can view project users" ON project_users FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

-- Admins and PMs can manage project users
CREATE POLICY "Admins can insert project users" ON project_users FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Admins can update project users" ON project_users FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Admins can delete project users" ON project_users FOR DELETE
  USING (
    project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

-- Service role bypass
CREATE POLICY "Service role has full access to project_users" ON project_users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- SUBCONTRACTOR_COMPANIES POLICIES
-- ============================================

CREATE POLICY "Users can view subcontractor companies in their company" ON subcontractor_companies FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage subcontractor companies" ON subcontractor_companies FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

CREATE POLICY "Admins can update subcontractor companies" ON subcontractor_companies FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

CREATE POLICY "Admins can delete subcontractor companies" ON subcontractor_companies FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

CREATE POLICY "Service role has full access to subcontractor_companies" ON subcontractor_companies FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PROJECT_RISK_PROFILES POLICIES
-- ============================================

CREATE POLICY "Project members can view risk profiles" ON project_risk_profiles FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can manage risk profiles" ON project_risk_profiles FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'hs'))
  );

CREATE POLICY "PMs can update risk profiles" ON project_risk_profiles FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'hs'))
  );

CREATE POLICY "Service role has full access to project_risk_profiles" ON project_risk_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- CLIENT_PORTAL_SETTINGS POLICIES
-- ============================================

CREATE POLICY "Project members can view client portal settings" ON client_portal_settings FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can manage client portal settings" ON client_portal_settings FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "PMs can update client portal settings" ON client_portal_settings FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to client_portal_settings" ON client_portal_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- DIARY_ENTRIES POLICIES
-- ============================================

CREATE POLICY "Project members can view diary entries" ON diary_entries FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "Project members can create diary entries" ON diary_entries FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own diary entries" ON diary_entries FOR UPDATE
  USING (
    created_by = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Users can delete their own diary entries" ON diary_entries FOR DELETE
  USING (
    created_by = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to diary_entries" ON diary_entries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- SITE_ATTENDANCE POLICIES
-- ============================================

CREATE POLICY "Users can view own attendance" ON site_attendance FOR SELECT
  USING (
    user_id = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "Users can create own attendance" ON site_attendance FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own attendance or PMs can verify" ON site_attendance FOR UPDATE
  USING (
    user_id = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "Service role has full access to site_attendance" ON site_attendance FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- INDUCTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own inductions" ON inductions FOR SELECT
  USING (
    user_id = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'hs'))
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "HS managers can create inductions" ON inductions FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'hs'))
  );

CREATE POLICY "HS managers can update inductions" ON inductions FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'hs'))
  );

CREATE POLICY "Service role has full access to inductions" ON inductions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PROGRAMME_ACTIVITIES POLICIES
-- ============================================

CREATE POLICY "Project members can view activities" ON programme_activities FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can create activities" ON programme_activities FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "PMs can update activities" ON programme_activities FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "PMs can delete activities" ON programme_activities FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to programme_activities" ON programme_activities FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PROGRESS_UPDATES POLICIES
-- ============================================

CREATE POLICY "Project members can view progress updates" ON progress_updates FOR SELECT
  USING (
    activity_id IN (SELECT id FROM programme_activities WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid()))
    OR activity_id IN (SELECT id FROM programme_activities WHERE project_id IN
      (SELECT id FROM projects WHERE company_id IN
        (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))))
  );

CREATE POLICY "Project members can create progress updates" ON progress_updates FOR INSERT
  WITH CHECK (
    activity_id IN (SELECT id FROM programme_activities WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid()))
  );

CREATE POLICY "PMs can update progress updates" ON progress_updates FOR UPDATE
  USING (
    updated_by = auth.uid()
    OR activity_id IN (SELECT id FROM programme_activities WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm'))
  );

CREATE POLICY "Service role has full access to progress_updates" ON progress_updates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- MILESTONES POLICIES
-- ============================================

CREATE POLICY "Project members can view milestones" ON milestones FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can create milestones" ON milestones FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "PMs can update milestones" ON milestones FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "PMs can delete milestones" ON milestones FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to milestones" ON milestones FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- BLOCKERS POLICIES
-- ============================================

CREATE POLICY "Project members can view blockers" ON blockers FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "Project members can create blockers" ON blockers FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Project members can update blockers" ON blockers FOR UPDATE
  USING (
    raised_by = auth.uid()
    OR project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "PMs can delete blockers" ON blockers FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to blockers" ON blockers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- DRAWINGS POLICIES
-- ============================================

CREATE POLICY "Project members can view drawings" ON drawings FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can create drawings" ON drawings FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "PMs can update drawings" ON drawings FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super'))
  );

CREATE POLICY "PMs can delete drawings" ON drawings FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to drawings" ON drawings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- DRAWING_REVISIONS POLICIES
-- ============================================

CREATE POLICY "Project members can view drawing revisions" ON drawing_revisions FOR SELECT
  USING (
    drawing_id IN (SELECT id FROM drawings WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid()))
    OR drawing_id IN (SELECT id FROM drawings WHERE project_id IN
      (SELECT id FROM projects WHERE company_id IN
        (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))))
  );

CREATE POLICY "PMs can create drawing revisions" ON drawing_revisions FOR INSERT
  WITH CHECK (
    drawing_id IN (SELECT id FROM drawings WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super')))
  );

CREATE POLICY "PMs can update drawing revisions" ON drawing_revisions FOR UPDATE
  USING (
    drawing_id IN (SELECT id FROM drawings WHERE project_id IN
      (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role IN ('pm', 'site_super')))
  );

CREATE POLICY "Service role has full access to drawing_revisions" ON drawing_revisions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- WEEKLY_REPORTS POLICIES
-- ============================================

CREATE POLICY "Project members can view weekly reports" ON weekly_reports FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM projects WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'director')))
  );

CREATE POLICY "PMs can create weekly reports" ON weekly_reports FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "PMs can update weekly reports" ON weekly_reports FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "PMs can delete weekly reports" ON weekly_reports FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm')
  );

CREATE POLICY "Service role has full access to weekly_reports" ON weekly_reports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- LESSON_VOTES POLICIES
-- ============================================

CREATE POLICY "Users can view votes on company lessons" ON lesson_votes FOR SELECT
  USING (
    lesson_id IN (SELECT id FROM lessons_learnt WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create their own votes" ON lesson_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND lesson_id IN (SELECT id FROM lessons_learnt WHERE company_id IN
      (SELECT company_id FROM user_profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update their own votes" ON lesson_votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON lesson_votes FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to lesson_votes" ON lesson_votes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- ADDITIONAL RFI POLICIES (DELETE was missing)
-- ============================================

CREATE POLICY "PMs can delete RFIs" ON rfis FOR DELETE
  USING (project_id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND role = 'pm'));

-- ============================================
-- ADDITIONAL LESSONS POLICIES (UPDATE/DELETE were missing)
-- ============================================

CREATE POLICY "Users can update their own lessons" ON lessons_learnt FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own lessons" ON lessons_learnt FOR DELETE
  USING (created_by = auth.uid());
