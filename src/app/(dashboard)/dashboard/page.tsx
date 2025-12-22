import { createClient } from "@/lib/supabase/server"
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile with company
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*, companies(*)")
    .eq("id", user.id)
    .single()

  const profile = profileData as ProfileWithCompany | null

  if (!profile || !profile.company_id) {
    redirect("/login")
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile.full_name.split(" ")[0]}
        </p>
      </div>

      {/* Portfolio Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects?.filter((p) => p.status !== "live").length || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeProjects.length}
            </div>
            <p className="text-xs text-muted-foreground">projects on schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground">projects need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">projects at risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Required */}
      {((overdueRfis && overdueRfis.length > 0) ||
        (pendingRams && pendingRams.length > 0) ||
        (overdueBlockers && overdueBlockers.length > 0) ||
        (pendingAttendance?.count && pendingAttendance.count > 0)) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
            <CardDescription className="text-amber-700">
              Items that need your immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueRfis?.map((rfi) => (
              <Link
                key={rfi.id}
                href={`/projects/${rfi.project_id}/rfi/${rfi.id}`}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileQuestion className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">
                      RFI-{String(rfi.rfi_number).padStart(3, "0")} overdue
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(rfi.projects as { name: string })?.name} - {rfi.subject}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">Overdue</Badge>
              </Link>
            ))}

            {pendingRams?.map((rams) => (
              <Link
                key={rams.id}
                href={`/projects/${rams.project_id}/rams`}
                className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">RAMS awaiting review</p>
                    <p className="text-xs text-muted-foreground">
                      {(rams.projects as { name: string })?.name} -{" "}
                      {rams.subcontractor_company}
                    </p>
                  </div>
                </div>
                <Badge>Review</Badge>
              </Link>
            ))}

            {overdueBlockers?.map((blocker) => (
              <Link
                key={blocker.id}
                href={`/projects/${blocker.project_id}/blockers/${blocker.id}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="font-medium text-sm">
                      BLK-{String(blocker.blocker_number).padStart(3, "0")} overdue
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(blocker.projects as { name: string })?.name} - {blocker.title}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  Overdue
                </Badge>
              </Link>
            ))}

            {pendingAttendance?.count && pendingAttendance.count > 0 && (
              <Link
                href="/projects"
                className="flex items-center justify-between rounded-lg border bg-white p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {pendingAttendance.count} attendance records pending verification
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Verify
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link href="/projects">
            <Button variant="outline" size="sm">
              View All
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No active projects</h3>
              <p className="text-muted-foreground text-center mb-4">
                {profile.role === "admin"
                  ? "Create your first project to get started"
                  : "You haven't been assigned to any projects yet"}
              </p>
              {profile.role === "admin" && (
                <Link href="/projects/new">
                  <Button>Create Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.client_name}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-700"
                      >
                        On Track
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target Completion</span>
                      <span className="font-medium">
                        {project.target_completion
                          ? format(new Date(project.target_completion), "d MMM yyyy")
                          : "Not set"}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        {(project.rfis as { count: number }[])?.[0]?.count || 0} RFIs
                      </span>
                      <span>
                        {(project.blockers as { count: number }[])?.[0]?.count || 0}{" "}
                        Blockers
                      </span>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(milestone.projects as { name: string })?.name}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {format(new Date(milestone.target_date), "d MMM")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
