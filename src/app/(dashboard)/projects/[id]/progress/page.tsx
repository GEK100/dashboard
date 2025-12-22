import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flag,
  Target,
} from "lucide-react"
import { format, isPast, isFuture, isToday, differenceInDays } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import { UpdateProgressButton } from "@/components/progress/UpdateProgressButton"
import type {
  UserProfile,
  Project,
  ProgrammeActivity,
  Milestone,
  ProjectRole,
  ActivityStatus,
  RagStatus,
} from "@/types/database"

interface ProgressPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ zone?: string; status?: string }>
}

export default async function ProgressPage({ params, searchParams }: ProgressPageProps) {
  const { id } = await params
  const { zone, status } = await searchParams
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

  // Fetch project
  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  const project = projectData as Project | null

  if (!project) {
    notFound()
  }

  // Get user's project role
  const { data: projectUserData } = await supabase
    .from("project_users")
    .select("role")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .single()

  const projectUser = projectUserData as { role: ProjectRole } | null

  // Fetch activities
  let activitiesQuery = supabase
    .from("programme_activities")
    .select("*")
    .eq("project_id", id)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("planned_start", { ascending: true })

  if (zone) {
    activitiesQuery = activitiesQuery.eq("zone", zone)
  }

  if (status) {
    activitiesQuery = activitiesQuery.eq("status", status)
  }

  const { data: activitiesData } = await activitiesQuery

  const activities = activitiesData as ProgrammeActivity[] | null

  // Fetch milestones
  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", id)
    .order("target_date", { ascending: true })

  const milestones = milestonesData as Milestone[] | null

  // Calculate stats
  const totalActivities = activities?.length || 0
  const completedActivities = activities?.filter((a) => a.status === "complete").length || 0
  const inProgressActivities = activities?.filter((a) => a.status === "in_progress").length || 0
  const delayedActivities = activities?.filter((a) => a.status === "delayed").length || 0

  // Calculate overall progress
  const overallProgress = totalActivities > 0
    ? Math.round(
        (activities?.reduce((sum, a) => sum + a.percent_complete, 0) || 0) / totalActivities
      )
    : 0

  // Get unique zones
  const zones = [...new Set(activities?.map((a) => a.zone).filter(Boolean))] as string[]

  // RAG status counts
  const ragCounts = {
    green: activities?.filter((a) => a.rag_status === "green").length || 0,
    amber: activities?.filter((a) => a.rag_status === "amber").length || 0,
    red: activities?.filter((a) => a.rag_status === "red").length || 0,
    grey: activities?.filter((a) => a.rag_status === "grey").length || 0,
  }

  const getStatusBadge = (activityStatus: ActivityStatus) => {
    switch (activityStatus) {
      case "complete":
        return <Badge className="bg-green-500">Complete</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "delayed":
        return <Badge className="bg-red-500">Delayed</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getRagIndicator = (rag: RagStatus) => {
    const colors = {
      green: "bg-green-500",
      amber: "bg-amber-500",
      red: "bg-red-500",
      grey: "bg-gray-400",
    }
    return (
      <div
        className={`w-3 h-3 rounded-full ${colors[rag]}`}
        title={rag.toUpperCase()}
      />
    )
  }

  const getMilestoneIcon = (m: Milestone) => {
    if (m.status === "complete") {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (m.status === "overdue") {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
    return <Flag className="h-5 w-5 text-blue-500" />
  }

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
            href={`/projects/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
              <p className="text-muted-foreground">
                Programme activities and milestones
              </p>
            </div>

            <Link href={`/projects/${id}/progress/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </Link>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalActivities}</p>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{inProgressActivities}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{completedActivities}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={delayedActivities > 0 ? "border-red-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`h-8 w-8 ${delayedActivities > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${delayedActivities > 0 ? "text-red-600" : ""}`}>
                    {delayedActivities}
                  </p>
                  <p className="text-sm text-muted-foreground">Delayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RAG Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">RAG Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">{ragCounts.green} Green</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-sm">{ragCounts.amber} Amber</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">{ragCounts.red} Red</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400" />
                <span className="text-sm">{ragCounts.grey} Not Started</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Link href={`/projects/${id}/progress`}>
                <Button variant={!status && !zone ? "default" : "outline"} size="sm">
                  All
                </Button>
              </Link>
              <Link href={`/projects/${id}/progress?status=in_progress`}>
                <Button variant={status === "in_progress" ? "default" : "outline"} size="sm">
                  In Progress
                </Button>
              </Link>
              <Link href={`/projects/${id}/progress?status=delayed`}>
                <Button variant={status === "delayed" ? "default" : "outline"} size="sm">
                  Delayed
                </Button>
              </Link>

              {zones.length > 0 && (
                <>
                  <div className="w-px h-8 bg-border mx-2" />
                  {zones.slice(0, 5).map((z) => (
                    <Link key={z} href={`/projects/${id}/progress?zone=${encodeURIComponent(z)}`}>
                      <Button variant={zone === z ? "default" : "outline"} size="sm">
                        {z}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activities List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  {activities?.length || 0} activities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!activities || activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No activities yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add activities to track project progress
                    </p>
                    <Link href={`/projects/${id}/progress/new`}>
                      <Button>Add Activity</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {getRagIndicator(activity.rag_status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{activity.activity_name}</p>
                                {getStatusBadge(activity.status)}
                              </div>
                              {activity.zone && (
                                <Badge variant="outline" className="mb-2">
                                  {activity.zone}
                                </Badge>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {activity.planned_start && (
                                  <span>
                                    Start: {format(new Date(activity.planned_start), "d MMM")}
                                  </span>
                                )}
                                {activity.planned_finish && (
                                  <span>
                                    Finish: {format(new Date(activity.planned_finish), "d MMM")}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={activity.percent_complete}
                                    className="h-2 flex-1"
                                  />
                                  <span className="text-sm font-medium w-12 text-right">
                                    {activity.percent_complete}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <UpdateProgressButton
                            activityId={activity.id}
                            projectId={id}
                            activityName={activity.activity_name}
                            currentProgress={activity.percent_complete}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Milestones */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Milestones
                </CardTitle>
                <CardDescription>
                  {milestones?.length || 0} milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!milestones || milestones.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No milestones defined
                  </div>
                ) : (
                  <div className="divide-y">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="p-4 hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-3">
                          {getMilestoneIcon(milestone)}
                          <div>
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(milestone.target_date), "d MMMM yyyy")}
                            </p>
                            {milestone.status === "overdue" && (
                              <p className="text-xs text-red-500 mt-1">
                                {differenceInDays(new Date(), new Date(milestone.target_date))} days overdue
                              </p>
                            )}
                            {milestone.actual_date && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed: {format(new Date(milestone.actual_date), "d MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
