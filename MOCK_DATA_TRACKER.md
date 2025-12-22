# Mock and Hardcoded Data Tracker

This document tracks all mock data, placeholder values, and hardcoded items that need to be reviewed or removed before production testing.

---

## Hardcoded Values

### Constants and Configuration

| Location | Description | Value | Action Required |
|----------|-------------|-------|-----------------|
| `src/app/(dashboard)/projects/new/page.tsx` | Client sectors dropdown | Array: NHS, MoJ, Education, etc. | Review if comprehensive |
| `src/app/(dashboard)/projects/new/page.tsx` | Project types dropdown | Array: Refurbishment, New Build, etc. | Review if comprehensive |
| `src/app/(dashboard)/projects/new/page.tsx` | Building types dropdown | Array: Healthcare, Government, etc. | Review if comprehensive |
| `src/app/(dashboard)/settings/users/page.tsx` | Role labels mapping | ROLE_LABELS object | These are actual roles, not mock data |
| `src/components/settings/InviteUserDialog.tsx` | Roles for invite | ROLES array | These are actual roles, not mock data |
| `src/app/(dashboard)/projects/[id]/diary/new/page.tsx` | Zone dropdown options | Array: Zone A, Zone B, etc. | Should come from project settings |
| `src/app/(dashboard)/projects/[id]/progress/new/page.tsx` | Zone dropdown options | Array: Zone A, Zone B, etc. | Should come from project settings |
| `src/app/(dashboard)/projects/[id]/progress/new/page.tsx` | Trade dropdown options | Array: Electrical, Mechanical, etc. | Should come from company settings |
| `src/app/(dashboard)/projects/[id]/blockers/new/page.tsx` | Zone dropdown options | Array: Zone A, Zone B, etc. | Should come from project settings |
| `src/app/(dashboard)/projects/[id]/blockers/new/page.tsx` | Trade dropdown options | Array: Electrical, Mechanical, etc. | Should come from company settings |
| `src/app/(dashboard)/projects/[id]/drawings/new/page.tsx` | Discipline dropdown options | Array: Electrical, Mechanical, etc. | Should come from company settings |
| `src/app/(dashboard)/projects/[id]/rfi/new/page.tsx` | Trade dropdown options | Array: Electrical, Mechanical, etc. | Should come from company settings |

### Database Defaults

| Location | Description | Value | Action Required |
|----------|-------------|-------|-----------------|
| `supabase/migrations/001_initial_schema.sql` | Default RFI days | 7 | Configurable per company |
| `supabase/migrations/001_initial_schema.sql` | Default warning days | 2 | Configurable per company |
| `supabase/migrations/001_initial_schema.sql` | Default geofence radius | 100m | Configurable per project |
| `supabase/migrations/001_initial_schema.sql` | Default primary color | #3b82f6 | Configurable per company |
| `supabase/migrations/001_initial_schema.sql` | Default secondary color | #1e40af | Configurable per company |

---

## Placeholder/Static UI Elements

### Dashboard Page

| Location | Element | Current State | Action Required |
|----------|---------|---------------|-----------------|
| `src/app/(dashboard)/dashboard/page.tsx` | "At Risk" projects count | Always shows 0 | Implement risk calculation logic |
| `src/app/(dashboard)/dashboard/page.tsx` | "Critical" projects count | Always shows 0 | Implement critical status logic |
| `src/app/(dashboard)/dashboard/page.tsx` | Project "On Track" badge | Always shows "On Track" | Implement actual status calculation |
| `src/app/(dashboard)/dashboard/page.tsx` | Progress percentage | Always shows 0% | Implement progress tracking |

### Project Detail Page

| Location | Element | Current State | Action Required |
|----------|---------|---------------|-----------------|
| `src/app/(dashboard)/projects/[id]/page.tsx` | Progress calculated from milestones | Simple milestone completion % | May need more sophisticated calculation |

---

## Features Using Placeholder Logic

### Authentication

| Feature | Current Implementation | Full Implementation Needed |
|---------|----------------------|---------------------------|
| User invitation | Creates profile directly | Should use Supabase Auth invite email |
| Magic link redirect | Basic redirect | Test thoroughly with different auth providers |

### Notifications

| Feature | Current Implementation | Full Implementation Needed |
|---------|----------------------|---------------------------|
| Real-time notifications | Supabase channel subscription | Test with actual notification triggers |
| Notification links | Basic link generation | Verify all notification types route correctly |

---

## TODO: Features Not Yet Implemented (Will Need Data)

These features are pending implementation and will need real or test data:

1. **Photo Verification for Attendance** - Deferred to Phase 2
   - Location: Attendance system
   - Note: Geofence-only sign-in for MVP

2. **AI Features** - Stubs created at `src/app/api/ai/*`
   - `analyze-rams` - Returns 501 Not Implemented
   - `transcribe` - Returns 501 Not Implemented
   - `analyze-diary` - Returns 501 Not Implemented
   - `generate-report` - Returns 501 Not Implemented
   - `find-lessons` - Returns 501 Not Implemented

3. **Offline/PWA Support** - Deferred to Phase 2

4. **Client Portal** - Needs separate view implementation
   - Settings page exists at `/projects/[id]/client-portal`
   - Client-specific views not yet implemented

---

## Test Data Recommendations

When setting up test data, create:

1. **Companies**
   - At least 2 companies to test multi-tenancy isolation
   - One with branding customization

2. **Users**
   - One user per role type (admin, director, pm, etc.)
   - Users in different companies
   - Subcontractor users

3. **Projects**
   - Mix of statuses (live, practical_completion, defects, closed)
   - Projects with and without client portal enabled
   - Projects with various risk profiles

4. **RFIs**
   - Open, responded, and closed
   - Some overdue
   - Some with attachments

5. **RAMS**
   - Awaiting, submitted, approved packages
   - Test upload tokens

6. **Blockers**
   - Various categories
   - Linked to RFIs and diary entries

---

## Notes

- All dropdown values (sectors, types, etc.) should be reviewed with the client to ensure they match business requirements
- Database default values are sensible defaults but should be configurable
- Static "On Track" and progress values need dynamic calculation based on actual data

Last Updated: December 2024
