export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'admin' | 'director' | 'pm' | 'site_super' | 'qs' | 'hs' | 'viewer'
export type ProjectRole = 'pm' | 'site_super' | 'qs' | 'hs' | 'viewer' | 'subcontractor' | 'client'
export type ProjectStatus = 'live' | 'practical_completion' | 'defects' | 'closed'
export type RfiStatus = 'open' | 'responded' | 'closed'
export type RamsPackageStatus = 'awaiting' | 'submitted' | 'approved'
export type RamsAiStatus = 'pass' | 'minor_issues' | 'requires_revision'
export type RamsPmStatus = 'pending' | 'approved' | 'rejected' | 'revision_required'
export type DiaryCategory = 'progress' | 'issue' | 'instruction' | 'visitor' | 'hs' | 'weather' | 'delivery' | 'general'
export type AiSentiment = 'positive' | 'neutral' | 'concern'
export type VerificationStatus = 'pending' | 'verified' | 'disputed'
export type ActivityStatus = 'not_started' | 'in_progress' | 'complete' | 'delayed'
export type RagStatus = 'green' | 'amber' | 'red' | 'grey'
export type BlockerStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type BlockerCategory = 'information' | 'access' | 'material' | 'labour' | 'weather' | 'client' | 'design' | 'other'
export type DrawingStatus = 'preliminary' | 'for_approval' | 'for_construction' | 'as_built'
export type MilestoneStatus = 'complete' | 'upcoming' | 'overdue'
export type LessonCategory = 'design' | 'procurement' | 'site_management' | 'hs' | 'commercial' | 'handover'
export type LessonType = 'success' | 'improvement' | 'risk'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          created_at: string
          updated_at: string
          default_rfi_days: number
          default_warning_days: number
          client_portal_enabled: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
          default_rfi_days?: number
          default_warning_days?: number
          client_portal_enabled?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
          default_rfi_days?: number
          default_warning_days?: number
          client_portal_enabled?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          company_id: string | null
          role: UserRole
          is_subcontractor: boolean
          is_client: boolean
          created_at: string
          last_login: string | null
          profile_photo_url: string | null
          notify_overdue: boolean
          notify_assigned: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          company_id?: string | null
          role?: UserRole
          is_subcontractor?: boolean
          is_client?: boolean
          created_at?: string
          last_login?: string | null
          profile_photo_url?: string | null
          notify_overdue?: boolean
          notify_assigned?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          company_id?: string | null
          role?: UserRole
          is_subcontractor?: boolean
          is_client?: boolean
          created_at?: string
          last_login?: string | null
          profile_photo_url?: string | null
          notify_overdue?: boolean
          notify_assigned?: boolean
        }
      }
      subcontractor_companies: {
        Row: {
          id: string
          user_id: string
          company_id: string
          company_name: string | null
          trade: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          company_name?: string | null
          trade?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          company_name?: string | null
          trade?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          reference: string | null
          address: string | null
          postcode: string | null
          latitude: number | null
          longitude: number | null
          geofence_radius: number
          start_date: string | null
          target_completion: string | null
          actual_completion: string | null
          contract_value: number | null
          status: ProjectStatus
          rfi_response_days: number
          warning_threshold_days: number
          client_name: string | null
          client_contact_name: string | null
          client_contact_email: string | null
          client_sector: string | null
          project_type: string | null
          building_type: string | null
          hero_image_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          reference?: string | null
          address?: string | null
          postcode?: string | null
          latitude?: number | null
          longitude?: number | null
          geofence_radius?: number
          start_date?: string | null
          target_completion?: string | null
          actual_completion?: string | null
          contract_value?: number | null
          status?: ProjectStatus
          rfi_response_days?: number
          warning_threshold_days?: number
          client_name?: string | null
          client_contact_name?: string | null
          client_contact_email?: string | null
          client_sector?: string | null
          project_type?: string | null
          building_type?: string | null
          hero_image_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          reference?: string | null
          address?: string | null
          postcode?: string | null
          latitude?: number | null
          longitude?: number | null
          geofence_radius?: number
          start_date?: string | null
          target_completion?: string | null
          actual_completion?: string | null
          contract_value?: number | null
          status?: ProjectStatus
          rfi_response_days?: number
          warning_threshold_days?: number
          client_name?: string | null
          client_contact_name?: string | null
          client_contact_email?: string | null
          client_sector?: string | null
          project_type?: string | null
          building_type?: string | null
          hero_image_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      project_risk_profiles: {
        Row: {
          id: string
          project_id: string
          occupied_building: boolean
          working_at_height: boolean
          hot_works: boolean
          live_services: boolean
          asbestos_presence: boolean
          confined_spaces: boolean
          public_interface: boolean
          manual_handling: boolean
          hazardous_substances: boolean
          lifting_operations: boolean
          custom_risks: Json
          scope_document_url: string | null
          scope_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          occupied_building?: boolean
          working_at_height?: boolean
          hot_works?: boolean
          live_services?: boolean
          asbestos_presence?: boolean
          confined_spaces?: boolean
          public_interface?: boolean
          manual_handling?: boolean
          hazardous_substances?: boolean
          lifting_operations?: boolean
          custom_risks?: Json
          scope_document_url?: string | null
          scope_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          occupied_building?: boolean
          working_at_height?: boolean
          hot_works?: boolean
          live_services?: boolean
          asbestos_presence?: boolean
          confined_spaces?: boolean
          public_interface?: boolean
          manual_handling?: boolean
          hazardous_substances?: boolean
          lifting_operations?: boolean
          custom_risks?: Json
          scope_document_url?: string | null
          scope_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_users: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: ProjectRole
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: ProjectRole
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: ProjectRole
          assigned_at?: string
          assigned_by?: string | null
        }
      }
      client_portal_settings: {
        Row: {
          id: string
          project_id: string
          show_programme: boolean
          show_progress_photos: boolean
          show_rag_status: boolean
          show_weekly_report: boolean
          show_rfi_register: boolean
          show_rfi_count_only: boolean
          show_drawing_register: boolean
          show_key_risks: boolean
          show_hs_stats: boolean
          welcome_message: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          show_programme?: boolean
          show_progress_photos?: boolean
          show_rag_status?: boolean
          show_weekly_report?: boolean
          show_rfi_register?: boolean
          show_rfi_count_only?: boolean
          show_drawing_register?: boolean
          show_key_risks?: boolean
          show_hs_stats?: boolean
          welcome_message?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          show_programme?: boolean
          show_progress_photos?: boolean
          show_rag_status?: boolean
          show_weekly_report?: boolean
          show_rfi_register?: boolean
          show_rfi_count_only?: boolean
          show_drawing_register?: boolean
          show_key_risks?: boolean
          show_hs_stats?: boolean
          welcome_message?: string | null
          updated_at?: string
        }
      }
      rfis: {
        Row: {
          id: string
          project_id: string
          rfi_number: number
          reference: string | null
          subject: string
          description: string
          location: string | null
          trade: string | null
          assigned_to: string | null
          assigned_to_email: string | null
          date_raised: string
          date_required: string
          date_responded: string | null
          status: RfiStatus
          is_overdue: boolean
          response: string | null
          response_by: string | null
          attachments: Json
          response_attachments: Json
          linked_drawing_id: string | null
          linked_blocker_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          rfi_number: number
          reference?: string | null
          subject: string
          description: string
          location?: string | null
          trade?: string | null
          assigned_to?: string | null
          assigned_to_email?: string | null
          date_raised?: string
          date_required: string
          date_responded?: string | null
          status?: RfiStatus
          is_overdue?: boolean
          response?: string | null
          response_by?: string | null
          attachments?: Json
          response_attachments?: Json
          linked_drawing_id?: string | null
          linked_blocker_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          rfi_number?: number
          reference?: string | null
          subject?: string
          description?: string
          location?: string | null
          trade?: string | null
          assigned_to?: string | null
          assigned_to_email?: string | null
          date_raised?: string
          date_required?: string
          date_responded?: string | null
          status?: RfiStatus
          is_overdue?: boolean
          response?: string | null
          response_by?: string | null
          attachments?: Json
          response_attachments?: Json
          linked_drawing_id?: string | null
          linked_blocker_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rams_packages: {
        Row: {
          id: string
          project_id: string
          subcontractor_id: string | null
          package_name: string
          scope_description: string | null
          deadline: string | null
          status: RamsPackageStatus
          upload_token: string | null
          current_submission_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          subcontractor_id?: string | null
          package_name: string
          scope_description?: string | null
          deadline?: string | null
          status?: RamsPackageStatus
          upload_token?: string | null
          current_submission_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          subcontractor_id?: string | null
          package_name?: string
          scope_description?: string | null
          deadline?: string | null
          status?: RamsPackageStatus
          upload_token?: string | null
          current_submission_id?: string | null
          created_at?: string
        }
      }
      rams_submissions: {
        Row: {
          id: string
          project_id: string
          package_id: string | null
          subcontractor_id: string | null
          subcontractor_company: string | null
          package_name: string | null
          document_url: string
          document_name: string | null
          version: number
          submitted_at: string
          submitted_by_name: string | null
          submitted_by_email: string | null
          ai_score: number | null
          ai_status: RamsAiStatus | null
          ai_analysis: Json | null
          ai_reviewed_at: string | null
          pm_status: RamsPmStatus
          pm_comments: string | null
          pm_reviewed_at: string | null
          pm_reviewed_by: string | null
          feedback_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          package_id?: string | null
          subcontractor_id?: string | null
          subcontractor_company?: string | null
          package_name?: string | null
          document_url: string
          document_name?: string | null
          version?: number
          submitted_at?: string
          submitted_by_name?: string | null
          submitted_by_email?: string | null
          ai_score?: number | null
          ai_status?: RamsAiStatus | null
          ai_analysis?: Json | null
          ai_reviewed_at?: string | null
          pm_status?: RamsPmStatus
          pm_comments?: string | null
          pm_reviewed_at?: string | null
          pm_reviewed_by?: string | null
          feedback_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          package_id?: string | null
          subcontractor_id?: string | null
          subcontractor_company?: string | null
          package_name?: string | null
          document_url?: string
          document_name?: string | null
          version?: number
          submitted_at?: string
          submitted_by_name?: string | null
          submitted_by_email?: string | null
          ai_score?: number | null
          ai_status?: RamsAiStatus | null
          ai_analysis?: Json | null
          ai_reviewed_at?: string | null
          pm_status?: RamsPmStatus
          pm_comments?: string | null
          pm_reviewed_at?: string | null
          pm_reviewed_by?: string | null
          feedback_sent_at?: string | null
          created_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          project_id: string
          entry_date: string
          entry_time: string
          category: DiaryCategory | null
          content: string
          original_audio_url: string | null
          zone: string | null
          location_description: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          photos: Json
          ai_entities: Json | null
          ai_suggestions: Json | null
          ai_linked_rfis: Json | null
          ai_linked_blockers: Json | null
          ai_sentiment: AiSentiment | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          entry_date?: string
          entry_time?: string
          category?: DiaryCategory | null
          content: string
          original_audio_url?: string | null
          zone?: string | null
          location_description?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          photos?: Json
          ai_entities?: Json | null
          ai_suggestions?: Json | null
          ai_linked_rfis?: Json | null
          ai_linked_blockers?: Json | null
          ai_sentiment?: AiSentiment | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          entry_date?: string
          entry_time?: string
          category?: DiaryCategory | null
          content?: string
          original_audio_url?: string | null
          zone?: string | null
          location_description?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          photos?: Json
          ai_entities?: Json | null
          ai_suggestions?: Json | null
          ai_linked_rfis?: Json | null
          ai_linked_blockers?: Json | null
          ai_sentiment?: AiSentiment | null
          created_by?: string
          created_at?: string
        }
      }
      site_attendance: {
        Row: {
          id: string
          project_id: string
          user_id: string
          sign_in_time: string
          sign_in_latitude: number | null
          sign_in_longitude: number | null
          sign_in_photo_url: string | null
          sign_in_verified: boolean
          sign_out_time: string | null
          sign_out_latitude: number | null
          sign_out_longitude: number | null
          auto_sign_out: boolean
          verified_by: string | null
          verified_at: string | null
          verification_status: VerificationStatus
          dispute_reason: string | null
          induction_valid: boolean
          rams_valid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          sign_in_time: string
          sign_in_latitude?: number | null
          sign_in_longitude?: number | null
          sign_in_photo_url?: string | null
          sign_in_verified?: boolean
          sign_out_time?: string | null
          sign_out_latitude?: number | null
          sign_out_longitude?: number | null
          auto_sign_out?: boolean
          verified_by?: string | null
          verified_at?: string | null
          verification_status?: VerificationStatus
          dispute_reason?: string | null
          induction_valid?: boolean
          rams_valid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          sign_in_time?: string
          sign_in_latitude?: number | null
          sign_in_longitude?: number | null
          sign_in_photo_url?: string | null
          sign_in_verified?: boolean
          sign_out_time?: string | null
          sign_out_latitude?: number | null
          sign_out_longitude?: number | null
          auto_sign_out?: boolean
          verified_by?: string | null
          verified_at?: string | null
          verification_status?: VerificationStatus
          dispute_reason?: string | null
          induction_valid?: boolean
          rams_valid?: boolean
          created_at?: string
        }
      }
      inductions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          completed_at: string
          expires_at: string | null
          certificate_url: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          completed_at?: string
          expires_at?: string | null
          certificate_url?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          completed_at?: string
          expires_at?: string | null
          certificate_url?: string | null
        }
      }
      programme_activities: {
        Row: {
          id: string
          project_id: string
          activity_name: string
          activity_reference: string | null
          zone: string | null
          trade: string | null
          planned_start: string | null
          planned_finish: string | null
          actual_start: string | null
          actual_finish: string | null
          percent_complete: number
          status: ActivityStatus
          rag_status: RagStatus
          imported_from_programme: boolean
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          activity_name: string
          activity_reference?: string | null
          zone?: string | null
          trade?: string | null
          planned_start?: string | null
          planned_finish?: string | null
          actual_start?: string | null
          actual_finish?: string | null
          percent_complete?: number
          status?: ActivityStatus
          rag_status?: RagStatus
          imported_from_programme?: boolean
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          activity_name?: string
          activity_reference?: string | null
          zone?: string | null
          trade?: string | null
          planned_start?: string | null
          planned_finish?: string | null
          actual_start?: string | null
          actual_finish?: string | null
          percent_complete?: number
          status?: ActivityStatus
          rag_status?: RagStatus
          imported_from_programme?: boolean
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      progress_updates: {
        Row: {
          id: string
          activity_id: string
          project_id: string
          percent_complete: number
          notes: string | null
          photos: Json
          updated_by: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          project_id: string
          percent_complete: number
          notes?: string | null
          photos?: Json
          updated_by: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          project_id?: string
          percent_complete?: number
          notes?: string | null
          photos?: Json
          updated_by?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          name: string
          target_date: string
          actual_date: string | null
          status: MilestoneStatus
          display_order: number | null
          show_on_client_portal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          target_date: string
          actual_date?: string | null
          status?: MilestoneStatus
          display_order?: number | null
          show_on_client_portal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          target_date?: string
          actual_date?: string | null
          status?: MilestoneStatus
          display_order?: number | null
          show_on_client_portal?: boolean
          created_at?: string
        }
      }
      blockers: {
        Row: {
          id: string
          project_id: string
          blocker_number: number
          title: string
          description: string
          category: BlockerCategory | null
          zone: string | null
          trade: string | null
          impact_description: string | null
          days_delayed: number | null
          responsible_party: string | null
          date_raised: string
          date_due: string | null
          date_resolved: string | null
          status: BlockerStatus
          is_overdue: boolean
          resolution_notes: string | null
          linked_rfi_id: string | null
          linked_diary_id: string | null
          lesson_captured: boolean
          raised_by: string
          resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          blocker_number: number
          title: string
          description: string
          category?: BlockerCategory | null
          zone?: string | null
          trade?: string | null
          impact_description?: string | null
          days_delayed?: number | null
          responsible_party?: string | null
          date_raised?: string
          date_due?: string | null
          date_resolved?: string | null
          status?: BlockerStatus
          is_overdue?: boolean
          resolution_notes?: string | null
          linked_rfi_id?: string | null
          linked_diary_id?: string | null
          lesson_captured?: boolean
          raised_by: string
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          blocker_number?: number
          title?: string
          description?: string
          category?: BlockerCategory | null
          zone?: string | null
          trade?: string | null
          impact_description?: string | null
          days_delayed?: number | null
          responsible_party?: string | null
          date_raised?: string
          date_due?: string | null
          date_resolved?: string | null
          status?: BlockerStatus
          is_overdue?: boolean
          resolution_notes?: string | null
          linked_rfi_id?: string | null
          linked_diary_id?: string | null
          lesson_captured?: boolean
          raised_by?: string
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      drawings: {
        Row: {
          id: string
          project_id: string
          drawing_number: string
          drawing_title: string
          discipline: string | null
          current_revision: string | null
          revision_date: string | null
          status: DrawingStatus
          next_revision_due: string | null
          is_overdue: boolean
          file_url: string | null
          imported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          drawing_number: string
          drawing_title: string
          discipline?: string | null
          current_revision?: string | null
          revision_date?: string | null
          status?: DrawingStatus
          next_revision_due?: string | null
          is_overdue?: boolean
          file_url?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          drawing_number?: string
          drawing_title?: string
          discipline?: string | null
          current_revision?: string | null
          revision_date?: string | null
          status?: DrawingStatus
          next_revision_due?: string | null
          is_overdue?: boolean
          file_url?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      drawing_revisions: {
        Row: {
          id: string
          drawing_id: string
          revision: string
          revision_date: string
          description: string | null
          issued_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          drawing_id: string
          revision: string
          revision_date: string
          description?: string | null
          issued_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          drawing_id?: string
          revision?: string
          revision_date?: string
          description?: string | null
          issued_by?: string | null
          created_at?: string
        }
      }
      weekly_reports: {
        Row: {
          id: string
          project_id: string
          week_ending: string
          report_number: number | null
          executive_summary: string | null
          progress_summary: string | null
          issues_summary: string | null
          lookahead_summary: string | null
          attendance_person_days: number | null
          rfis_raised: number | null
          rfis_closed: number | null
          blockers_raised: number | null
          blockers_resolved: number | null
          progress_photos_count: number | null
          overall_rag: RagStatus | null
          selected_photos: Json
          pdf_url: string | null
          published_at: string | null
          published_by: string | null
          shared_with_client: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          week_ending: string
          report_number?: number | null
          executive_summary?: string | null
          progress_summary?: string | null
          issues_summary?: string | null
          lookahead_summary?: string | null
          attendance_person_days?: number | null
          rfis_raised?: number | null
          rfis_closed?: number | null
          blockers_raised?: number | null
          blockers_resolved?: number | null
          progress_photos_count?: number | null
          overall_rag?: RagStatus | null
          selected_photos?: Json
          pdf_url?: string | null
          published_at?: string | null
          published_by?: string | null
          shared_with_client?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          week_ending?: string
          report_number?: number | null
          executive_summary?: string | null
          progress_summary?: string | null
          issues_summary?: string | null
          lookahead_summary?: string | null
          attendance_person_days?: number | null
          rfis_raised?: number | null
          rfis_closed?: number | null
          blockers_raised?: number | null
          blockers_resolved?: number | null
          progress_photos_count?: number | null
          overall_rag?: RagStatus | null
          selected_photos?: Json
          pdf_url?: string | null
          published_at?: string | null
          published_by?: string | null
          shared_with_client?: boolean
          created_at?: string
        }
      }
      lessons_learnt: {
        Row: {
          id: string
          company_id: string
          project_id: string | null
          title: string
          category: LessonCategory | null
          lesson_type: LessonType | null
          description: string
          recommendation: string
          project_type: string | null
          client_sector: string | null
          building_type: string | null
          impact_weeks: number | null
          impact_cost: number | null
          tags: Json
          linked_blocker_id: string | null
          linked_rfi_id: string | null
          linked_diary_id: string | null
          vote_count: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id?: string | null
          title: string
          category?: LessonCategory | null
          lesson_type?: LessonType | null
          description: string
          recommendation: string
          project_type?: string | null
          client_sector?: string | null
          building_type?: string | null
          impact_weeks?: number | null
          impact_cost?: number | null
          tags?: Json
          linked_blocker_id?: string | null
          linked_rfi_id?: string | null
          linked_diary_id?: string | null
          vote_count?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string | null
          title?: string
          category?: LessonCategory | null
          lesson_type?: LessonType | null
          description?: string
          recommendation?: string
          project_type?: string | null
          client_sector?: string | null
          building_type?: string | null
          impact_weeks?: number | null
          impact_cost?: number | null
          tags?: Json
          linked_blocker_id?: string | null
          linked_rfi_id?: string | null
          linked_diary_id?: string | null
          vote_count?: number
          created_by?: string | null
          created_at?: string
        }
      }
      lesson_votes: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          user_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link_type: string | null
          link_id: string | null
          project_id: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link_type?: string | null
          link_id?: string | null
          project_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          link_type?: string | null
          link_id?: string | null
          project_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_rfi_number: {
        Args: { p_project_id: string }
        Returns: number
      }
      get_next_blocker_number: {
        Args: { p_project_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types for common operations
export type Company = Database['public']['Tables']['companies']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectRiskProfile = Database['public']['Tables']['project_risk_profiles']['Row']
export type ProjectUser = Database['public']['Tables']['project_users']['Row']
export type ClientPortalSettings = Database['public']['Tables']['client_portal_settings']['Row']
export type Rfi = Database['public']['Tables']['rfis']['Row']
export type RamsPackage = Database['public']['Tables']['rams_packages']['Row']
export type RamsSubmission = Database['public']['Tables']['rams_submissions']['Row']
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row']
export type SiteAttendance = Database['public']['Tables']['site_attendance']['Row']
export type Induction = Database['public']['Tables']['inductions']['Row']
export type ProgrammeActivity = Database['public']['Tables']['programme_activities']['Row']
export type ProgressUpdate = Database['public']['Tables']['progress_updates']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Blocker = Database['public']['Tables']['blockers']['Row']
export type Drawing = Database['public']['Tables']['drawings']['Row']
export type DrawingRevision = Database['public']['Tables']['drawing_revisions']['Row']
export type WeeklyReport = Database['public']['Tables']['weekly_reports']['Row']
export type LessonLearnt = Database['public']['Tables']['lessons_learnt']['Row']
export type LessonVote = Database['public']['Tables']['lesson_votes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Insert types
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type RfiInsert = Database['public']['Tables']['rfis']['Insert']
export type BlockerInsert = Database['public']['Tables']['blockers']['Insert']
export type DiaryEntryInsert = Database['public']['Tables']['diary_entries']['Insert']

// Update types
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type RfiUpdate = Database['public']['Tables']['rfis']['Update']
export type BlockerUpdate = Database['public']['Tables']['blockers']['Update']
