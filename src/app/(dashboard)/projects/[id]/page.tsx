import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Settings,
  FileQuestion,
  FileCheck,
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  FileImage,
  FileText,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, ProjectRiskProfile, ClientPortalSettings, Milestone, DiaryEntry, ProjectRole } from "@/types/database"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile = profileData as UserProfile | null

  if (!profile) {
    redirect("/login")
  }

  // Fetch project with related data
  type ProjectWithRelations = Project & {
    project_risk_profiles: ProjectRiskProfile | null
    client_portal_settings: ClientPortalSettings | null
  }
  const { data: projectData, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_risk_profiles(*),
      client_portal_settings(*)
    `)
    .eq("id", id)
    .single()

  const project = projectData as ProjectWithRelations | null

  if (error || !project) {
    notFound()
  }

  // Check access
  const hasAccess =
    ["admin", "director", "super_admin"].includes(profile.role) ||
    (await supabase
      .from("project_users")
      .select("id")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .single()
      .then((res) => !!res.data))

  if (!hasAccess) {
    redirect("/projects")
  }

  // Get user's project role
  const { data: projectUserData } = await supabase
    .from("project_users")
    .select("role")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .single()

  const projectUser = projectUserData as { role: ProjectRole } | null

  // Fetch statistics
  const [
    rfiCountResult,
    openRfiCountResult,
    overdueRfiCountResult,
    blockerCountResult,
    openBlockerCountResult,
    ramsCountResult,
    pendingRamsCountResult,
    todayAttendanceResult,
    recentDiaryResult,
    milestonesResult,
  ] = await Promise.all([
    supabase.from("rfis").select("*", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("rfis").select("*", { count: "exact", head: true }).eq("project_id", id).eq("status", "open"),
    supabase.from("rfis").select("*", { count: "exact", head: true }).eq("project_id", id).eq("is_overdue", true),
    supabase.from("blockers").select("*", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("blockers").select("*", { count: "exact", head: true }).eq("project_id", id).in("status", ["open", "in_progress"]),
    supabase.from("rams_packages").select("*", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("rams_submissions").select("*", { count: "exact", head: true }).eq("project_id", id).eq("pm_status", "pending"),
    supabase.from("site_attendance").select("*", { count: "exact", head: true }).eq("project_id", id).gte("sign_in_time", new Date().toISOString().split("T")[0]),
    supabase.from("diary_entries").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("milestones").select("*").eq("project_id", id).order("target_date", { ascending: true }),
  ])

  const rfiCount = rfiCountResult.count
  const openRfiCount = openRfiCountResult.count
  const overdueRfiCount = overdueRfiCountResult.count
  const blockerCount = blockerCountResult.count
  const openBlockerCount = openBlockerCountResult.count
  const ramsCount = ramsCountResult.count
  const pendingRamsCount = pendingRamsCountResult.count
  const todayAttendance = todayAttendanceResult.count
  const recentDiary = recentDiaryResult.data as DiaryEntry[] | null
  const milestones = milestonesResult.data as Milestone[] | null

  // Calculate overall progress (simplified - would use activities in full implementation)
  const completedMilestones = milestones?.filter((m) => m.status === "complete").length || 0
  const totalMilestones = milestones?.length || 0
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-500">Active</Badge>
      case "practical_completion":
        return <Badge className="bg-blue-500">Practical Completion</Badge>
      case "defects":
        return <Badge className="bg-amber-500">Defects Period</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const quickLinks = [
    { href: `/projects/${id}/rfi`, label: "RFIs", icon: FileQuestion, count: openRfiCount || 0, alert: overdueRfiCount },
    { href: `/projects/${id}/rams`, label: "RAMS", icon: FileCheck, count: ramsCount || 0, alert: pendingRamsCount },
    { href: `/projects/${id}/diary`, label: "Diary", icon: BookOpen },
    { href: `/projects/${id}/attendance`, label: "Attendance", icon: Users, count: todayAttendance || 0 },
    { href: `/projects/${id}/progress`, label: "Progress", icon: TrendingUp },
    { href: `/projects/${id}/blockers`, label: "Blockers", icon: AlertTriangle, count: openBlockerCount || 0 },
    { href: `/projects/${id}/drawings`, label: "Drawings", icon: FileImage },
    { href: `/projects/${id}/reports`, label: "Reports", icon: FileText },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar
        projectId={id}
        projectName={project.name}
        userRole={profile.role}
        projectRole={projectUser?.role}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                {getStatusBadge(project.status)}
              </div>
              {project.client_name && (
                <p className="text-muted-foreground">{project.client_name}</p>
              )}
            </div>

            {(profile.role === "admin" || projectUser?.role === "pm") && (
              <Link href={`/projects/${id}/settings`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Project Info Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {project.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{project.postcode || project.address}</span>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Started {format(new Date(project.start_date), "d MMM yyyy")}</span>
            </div>
          )}
          {project.target_completion && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due {format(new Date(project.target_completion), "d MMM yyyy")}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>{progressPercent}% Complete</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{progressPercent}%</div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          <Card className={overdueRfiCount && overdueRfiCount > 0 ? "border-red-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                RFIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRfiCount || 0} open</div>
              {overdueRfiCount && overdueRfiCount > 0 ? (
                <p className="text-sm text-red-600">{overdueRfiCount} overdue</p>
              ) : (
                <p className="text-sm text-muted-foreground">{rfiCount || 0} total</p>
              )}
            </CardContent>
          </Card>

          <Card className={pendingRamsCount && pendingRamsCount > 0 ? "border-amber-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                RAMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRamsCount || 0} pending</div>
              <p className="text-sm text-muted-foreground">{ramsCount || 0} packages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Blockers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openBlockerCount || 0} active</div>
              <p className="text-sm text-muted-foreground">{blockerCount || 0} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="relative">
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      {link.alert && link.alert > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                          {link.alert}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{link.label}</p>
                      {link.count !== undefined && (
                        <p className="text-sm text-muted-foreground">{link.count}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        milestone.status === "complete"
                          ? "bg-green-100 text-green-600"
                          : milestone.status === "overdue"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {milestone.status === "complete" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {milestone.status === "complete" && milestone.actual_date
                          ? `Completed ${format(new Date(milestone.actual_date), "d MMM yyyy")}`
                          : format(new Date(milestone.target_date), "d MMM yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        milestone.status === "complete"
                          ? "default"
                          : milestone.status === "overdue"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Diary Entries */}
        {recentDiary && recentDiary.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Diary Entries</CardTitle>
              <Link href={`/projects/${id}/diary`}>
                <Button variant="ghost" size="sm">
                  View All
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDiary.map((entry) => (
                  <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.category || "general"}
                      </Badge>
                      {entry.zone && (
                        <span className="text-xs text-muted-foreground">
                          {entry.zone}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
