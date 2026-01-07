import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileQuestion,
  FileCheck,
  Users,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow, format, addDays } from "date-fns"
import type { UserProfile, Company, Project, Rfi, Blocker, RamsSubmission, Milestone } from "@/types/database"

type ProfileWithCompany = UserProfile & { companies: Company | null }

export default async function DashboardPage() {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile with company using service client (bypasses RLS)
  const { data: profileData } = await serviceClient
    .from("user_profiles")
    .select("*, companies(*)")
    .eq("id", user.id)
    .single()

  const profile = profileData as ProfileWithCompany | null

  if (!profile) {
    redirect("/login")
  }

  // If user doesn't have a company, redirect to setup
  if (!profile.company_id) {
    redirect("/setup")
  }

  // Fetch projects based on user role
  let projectIds: string[] | null = null

  // If not admin/director, only show assigned projects
  if (!["admin", "director", "super_admin"].includes(profile.role)) {
    const { data: projectUsers } = await supabase
      .from("project_users")
      .select("project_id")
      .eq("user_id", user.id)

    projectIds = projectUsers?.map((pu: { project_id: string }) => pu.project_id) || []
  }

  const projectsQuery = supabase
    .from("projects")
    .select(`
      *,
      rfis:rfis(count),
      blockers:blockers(count),
      rams_packages:rams_packages(count)
    `)
    .eq("company_id", profile.company_id)

  const { data: projectsData } = projectIds
    ? await projectsQuery.in("id", projectIds)
    : await projectsQuery

  type ProjectWithCounts = Project & {
    rfis: { count: number }[]
    blockers: { count: number }[]
    rams_packages: { count: number }[]
  }
  const projects = projectsData as ProjectWithCounts[] | null

  // Fetch overdue items
  const today = new Date().toISOString().split("T")[0]

  type RfiWithProject = Rfi & { projects: { name: string } | null }
  const { data: overdueRfisData } = await supabase
    .from("rfis")
    .select("*, projects(name)")
    .eq("status", "open")
    .eq("is_overdue", true)
    .limit(5)
  const overdueRfis = overdueRfisData as RfiWithProject[] | null

  type RamsWithProject = RamsSubmission & { projects: { name: string } | null }
  const { data: pendingRamsData } = await supabase
    .from("rams_submissions")
    .select("*, projects(name)")
    .eq("pm_status", "pending")
    .limit(5)
  const pendingRams = pendingRamsData as RamsWithProject[] | null

  type BlockerWithProject = Blocker & { projects: { name: string } | null }
  const { data: overdueBlockersData } = await supabase
    .from("blockers")
    .select("*, projects(name)")
    .eq("status", "open")
    .eq("is_overdue", true)
    .limit(5)
  const overdueBlockers = overdueBlockersData as BlockerWithProject[] | null

  const { data: pendingAttendance } = await supabase
    .from("site_attendance")
    .select("count")
    .eq("verification_status", "pending")
    .single() as { data: { count: number } | null }

  // Calculate portfolio stats
  const activeProjects = projects?.filter((p) => p.status === "live") || []
  const projectsOnTrack = activeProjects.filter((p) => {
    // Simple logic - project is on track if no overdue items
    // In real app, calculate from activities
    return true
  })

  // Fetch upcoming milestones
  type MilestoneWithProject = Milestone & { projects: { name: string } | null }
  const { data: upcomingMilestonesData } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .eq("status", "upcoming")
    .gte("target_date", today)
    .lte("target_date", addDays(new Date(), 7).toISOString().split("T")[0])
    .order("target_date", { ascending: true })
    .limit(5)
  const upcomingMilestones = upcomingMilestonesData as MilestoneWithProject[] | null

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Header with Gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Building2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-h2 font-semibold text-white">
                Welcome back, {profile.full_name.split(" ")[0]}
              </h1>
              <p className="text-body-sm text-slate-300 mt-1">
                {profile.companies?.name || "Your Dashboard"} • {activeProjects.length} active projects
              </p>
            </div>
          </div>
          {(overdueRfis && overdueRfis.length > 0) || (overdueBlockers && overdueBlockers.length > 0) ? (
            <div className="hidden sm:block bg-red-500/20 px-4 py-3 rounded-lg border border-red-500/30">
              <div className="text-metric-sm font-semibold text-red-400">
                {(overdueRfis?.length || 0) + (overdueBlockers?.length || 0)}
              </div>
              <div className="text-caption text-slate-300 uppercase tracking-wide">Overdue Items</div>
            </div>
          ) : (
            <div className="hidden sm:block bg-emerald-500/20 px-4 py-3 rounded-lg border border-emerald-500/30">
              <div className="text-metric-sm font-semibold text-emerald-400">0</div>
              <div className="text-caption text-slate-300 uppercase tracking-wide">Issues</div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Health Cards */}
      <div className="grid-responsive">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground uppercase tracking-wide">Active Projects</p>
                <p className="text-metric text-foreground mt-1">{activeProjects.length}</p>
                <p className="text-body-sm text-muted-foreground mt-2">
                  {projects?.filter((p) => p.status !== "live").length || 0} completed
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Building2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground uppercase tracking-wide">On Track</p>
                <p className="text-metric text-emerald-500 mt-1">{activeProjects.length}</p>
                <p className="text-body-sm text-emerald-600 mt-2">projects on schedule</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground uppercase tracking-wide">At Risk</p>
                <p className="text-metric text-amber-500 mt-1">0</p>
                <p className="text-body-sm text-muted-foreground mt-2">need attention</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground uppercase tracking-wide">Critical</p>
                <p className="text-metric text-red-500 mt-1">0</p>
                <p className="text-body-sm text-muted-foreground mt-2">urgent issues</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention Required */}
      {((overdueRfis && overdueRfis.length > 0) ||
        (pendingRams && pendingRams.length > 0) ||
        (overdueBlockers && overdueBlockers.length > 0) ||
        (pendingAttendance?.count && pendingAttendance.count > 0)) && (
        <Card className="border-amber-500/50 bg-amber-950/20 animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-h3">Attention Required</span>
            </CardTitle>
            <CardDescription className="text-amber-300/70 text-body-sm">
              Items that need your immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueRfis?.map((rfi) => (
              <Link
                key={rfi.id}
                href={`/projects/${rfi.project_id}/rfi/${rfi.id}`}
                className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/30 p-4 hover:bg-red-950/50 transition-all hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <FileQuestion className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">
                      RFI-{String(rfi.rfi_number).padStart(3, "0")} overdue
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {(rfi.projects as { name: string })?.name} - {rfi.subject}
                    </p>
                  </div>
                </div>
                <span className="status-rejected">Overdue</span>
              </Link>
            ))}

            {pendingRams?.map((rams) => (
              <Link
                key={rams.id}
                href={`/projects/${rams.project_id}/rams`}
                className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-950/30 p-4 hover:bg-blue-950/50 transition-all hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">RAMS awaiting review</p>
                    <p className="text-caption text-muted-foreground">
                      {(rams.projects as { name: string })?.name} -{" "}
                      {rams.subcontractor_company}
                    </p>
                  </div>
                </div>
                <span className="status-assigned">Review</span>
              </Link>
            ))}

            {overdueBlockers?.map((blocker) => (
              <Link
                key={blocker.id}
                href={`/projects/${blocker.project_id}/blockers/${blocker.id}`}
                className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/30 p-4 hover:bg-amber-950/50 transition-all hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">
                      BLK-{String(blocker.blocker_number).padStart(3, "0")} overdue
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {(blocker.projects as { name: string })?.name} - {blocker.title}
                    </p>
                  </div>
                </div>
                <span className="status-pending">Overdue</span>
              </Link>
            ))}

            {pendingAttendance?.count && pendingAttendance.count > 0 && (
              <Link
                href="/projects"
                className="flex items-center justify-between rounded-lg border border-muted bg-card p-4 hover:bg-muted transition-all hover-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">
                      {pendingAttendance.count} attendance records pending verification
                    </p>
                  </div>
                </div>
                <button className="btn btn-outline-emerald btn-sm">Verify</button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h2 text-foreground">Your Projects</h2>
          <Link href="/projects">
            <button className="btn btn-outline btn-sm">
              View All
              <ExternalLink className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-2xl mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-h3 mb-2">No active projects</h3>
              <p className="text-body-sm text-muted-foreground text-center mb-6 max-w-sm">
                {profile.role === "admin"
                  ? "Create your first project to get started tracking construction activities"
                  : "You haven't been assigned to any projects yet"}
              </p>
              {profile.role === "admin" && (
                <Link href="/projects/new">
                  <button className="btn btn-primary">Create Project</button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid-responsive-3">
            {activeProjects.slice(0, 6).map((project, index) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover-lift cursor-pointer h-full" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-h3 truncate">{project.name}</CardTitle>
                        <CardDescription className="text-body-sm mt-1">{project.client_name}</CardDescription>
                      </div>
                      <span className="status-verified shrink-0">On Track</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-body-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-emerald-500">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>

                    <div className="flex justify-between text-body-sm">
                      <span className="text-muted-foreground">Target Completion</span>
                      <span className="font-medium">
                        {project.target_completion
                          ? format(new Date(project.target_completion), "d MMM yyyy")
                          : "Not set"}
                      </span>
                    </div>

                    <div className="flex gap-4 pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                        <FileQuestion className="h-4 w-4" />
                        <span>{(project.rfis as { count: number }[])?.[0]?.count || 0} RFIs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{(project.blockers as { count: number }[])?.[0]?.count || 0} Blockers</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming This Week */}
      {upcomingMilestones && upcomingMilestones.length > 0 && (
        <Card className="animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-h3">Upcoming This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-body-sm font-medium">{milestone.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {(milestone.projects as { name: string })?.name}
                    </p>
                  </div>
                  <span className="status-assigned">
                    {format(new Date(milestone.target_date), "d MMM")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
