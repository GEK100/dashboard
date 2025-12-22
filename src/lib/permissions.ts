import type { UserProfile, ProjectUser, UserRole, ProjectRole } from '@/types/database'

// Company-level permissions based on user role
export function canCreateProject(user: UserProfile): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

export function canEditCompanySettings(user: UserProfile): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

export function canManageUsers(user: UserProfile): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

export function canViewAllProjects(user: UserProfile): boolean {
  return ['admin', 'director', 'super_admin'].includes(user.role)
}

// Project-level permissions
export function canEditProject(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

export function canAddUsersToProject(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// RFI permissions
export function canCreateRfi(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'site_super'
}

export function canRespondToRfi(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// RAMS permissions
export function canApproveRams(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'hs'
}

export function canUploadRams(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  return projectRole === 'subcontractor'
}

// Diary permissions
export function canCreateDiaryEntry(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'site_super'
}

// Attendance permissions
export function canSignInToSite(projectRole?: ProjectRole): boolean {
  return ['pm', 'site_super', 'subcontractor'].includes(projectRole || '')
}

export function canVerifyAttendance(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// Progress permissions
export function canUpdateProgress(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'site_super'
}

// Blocker permissions
export function canCreateBlocker(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'site_super'
}

export function canResolveBlocker(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// Report permissions
export function canGenerateReport(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'director', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// Client portal permissions
export function canConfigureClientPortal(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm'
}

// Lessons learnt permissions
export function canAddLesson(
  userRole: UserRole,
  projectRole?: ProjectRole
): boolean {
  if (['admin', 'super_admin'].includes(userRole)) return true
  return projectRole === 'pm' || projectRole === 'site_super'
}

export function canViewLessons(user: UserProfile): boolean {
  // All internal users except clients can view lessons
  return !user.is_client && !user.is_subcontractor
}

// Helper to get user's project role
export function getUserProjectRole(
  projectUsers: ProjectUser[],
  userId: string
): ProjectRole | undefined {
  const projectUser = projectUsers.find(pu => pu.user_id === userId)
  return projectUser?.role
}

// Permission matrix helper for UI
export type PermissionKey =
  | 'createProject'
  | 'editCompanySettings'
  | 'manageUsers'
  | 'viewAllProjects'
  | 'editProject'
  | 'addUsersToProject'
  | 'createRfi'
  | 'respondToRfi'
  | 'approveRams'
  | 'uploadRams'
  | 'createDiaryEntry'
  | 'signInToSite'
  | 'verifyAttendance'
  | 'updateProgress'
  | 'createBlocker'
  | 'resolveBlocker'
  | 'generateReport'
  | 'configureClientPortal'
  | 'addLesson'
  | 'viewLessons'

export function checkPermission(
  permission: PermissionKey,
  user: UserProfile,
  projectRole?: ProjectRole
): boolean {
  switch (permission) {
    case 'createProject':
      return canCreateProject(user)
    case 'editCompanySettings':
      return canEditCompanySettings(user)
    case 'manageUsers':
      return canManageUsers(user)
    case 'viewAllProjects':
      return canViewAllProjects(user)
    case 'editProject':
      return canEditProject(user.role, projectRole)
    case 'addUsersToProject':
      return canAddUsersToProject(user.role, projectRole)
    case 'createRfi':
      return canCreateRfi(user.role, projectRole)
    case 'respondToRfi':
      return canRespondToRfi(user.role, projectRole)
    case 'approveRams':
      return canApproveRams(user.role, projectRole)
    case 'uploadRams':
      return canUploadRams(user.role, projectRole)
    case 'createDiaryEntry':
      return canCreateDiaryEntry(user.role, projectRole)
    case 'signInToSite':
      return canSignInToSite(projectRole)
    case 'verifyAttendance':
      return canVerifyAttendance(user.role, projectRole)
    case 'updateProgress':
      return canUpdateProgress(user.role, projectRole)
    case 'createBlocker':
      return canCreateBlocker(user.role, projectRole)
    case 'resolveBlocker':
      return canResolveBlocker(user.role, projectRole)
    case 'generateReport':
      return canGenerateReport(user.role, projectRole)
    case 'configureClientPortal':
      return canConfigureClientPortal(user.role, projectRole)
    case 'addLesson':
      return canAddLesson(user.role, projectRole)
    case 'viewLessons':
      return canViewLessons(user)
    default:
      return false
  }
}
