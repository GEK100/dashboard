import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, Blocker, ProjectRole, BlockerStatus, BlockerCategory } from "@/types/database"

interface BlockersPageProps {
  params: Promise<{ id: string }>
}

export default async function BlockersPage({ params }: BlockersPageProps) {
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

  // Fetch blockers with raised_by user info
  const { data: blockersData } = await supabase
    .from("blockers")
    .select(`
      *,
      user_profiles!blockers_raised_by_fkey(full_name)
    `)
    .eq("project_id", id)
    .order("date_raised", { ascending: false })

  const blockers = blockersData as (Blocker & {
    user_profiles: { full_name: string } | null
  })[] | null

  // Stats
  const openBlockers = blockers?.filter((b) => b.status === "open") || []
  const inProgressBlockers = blockers?.filter((b) => b.status === "in_progress") || []
  const resolvedBlockers = blockers?.filter((b) => b.status === "resolved" || b.status === "closed") || []
  const overdueBlockers = blockers?.filter(
    (b) => b.date_due && isPast(new Date(b.date_due)) && b.status !== "resolved" && b.status !== "closed"
  ) || []

  const getStatusBadge = (status: BlockerStatus) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-500">Open</Badge>
      case "in_progress":
        return <Badge className="bg-amber-500">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: BlockerCategory | null) => {
    const categoryLabels: Record<string, string> = {
      information: "Information",
      access: "Access",
      material: "Material",
      labour: "Labour",
      weather: "Weather",
      client: "Client",
      design: "Design",
      other: "Other",
    }

    if (!category) return null

    return (
      <Badge variant="outline" className="text-xs">
        {categoryLabels[category] || category}
      </Badge>
    )
  }

  const renderBlockersList = (blockersList: typeof blockers) => {
    if (!blockersList || blockersList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No blockers in this category
        </div>
      )
    }

    return (
      <div className="divide-y">
        {blockersList.map((blocker) => (
          <Link
            key={blocker.id}
            href={`/projects/${id}/blockers/${blocker.id}`}
            className="block hover:bg-muted/50 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground">
                      B-{String(blocker.blocker_number).padStart(3, "0")}
                    </span>
                    {getStatusBadge(blocker.status)}
                    {getCategoryBadge(blocker.category)}
                    {blocker.date_due && isPast(new Date(blocker.date_due)) &&
                     blocker.status !== "resolved" && blocker.status !== "closed" && (
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    )}
                  </div>
                  <p className="font-medium mb-1">{blocker.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {blocker.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {blocker.user_profiles?.full_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(blocker.date_raised), "d MMM yyyy")}
                    </span>
                    {blocker.date_due && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {format(new Date(blocker.date_due), "d MMM")}
                      </span>
                    )}
                    {blocker.days_delayed && blocker.days_delayed > 0 && (
                      <span className="text-red-500">
                        {blocker.days_delayed} days delayed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
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
              <h1 className="text-3xl font-bold tracking-tight">Blockers Register</h1>
              <p className="text-muted-foreground">
                Track and resolve project blockers
              </p>
            </div>

            <Link href={`/projects/${id}/blockers/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Raise Blocker
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={openBlockers.length > 0 ? "border-red-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <XCircle className={`h-8 w-8 ${openBlockers.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${openBlockers.length > 0 ? "text-red-600" : ""}`}>
                    {openBlockers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={inProgressBlockers.length > 0 ? "border-amber-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className={`h-8 w-8 ${inProgressBlockers.length > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${inProgressBlockers.length > 0 ? "text-amber-600" : ""}`}>
                    {inProgressBlockers.length}
                  </p>
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
                  <p className="text-2xl font-bold">{resolvedBlockers.length}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={overdueBlockers.length > 0 ? "border-red-200 bg-red-50/50" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`h-8 w-8 ${overdueBlockers.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${overdueBlockers.length > 0 ? "text-red-600" : ""}`}>
                    {overdueBlockers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockers List */}
        <Card>
          <CardHeader>
            <CardTitle>Blockers</CardTitle>
            <CardDescription>
              {blockers?.length || 0} total blockers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="open" className="w-full">
              <div className="px-6 border-b">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="open"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Open ({openBlockers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="in_progress"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    In Progress ({inProgressBlockers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Resolved ({resolvedBlockers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    All ({blockers?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="open" className="m-0">
                {renderBlockersList(openBlockers)}
              </TabsContent>

              <TabsContent value="in_progress" className="m-0">
                {renderBlockersList(inProgressBlockers)}
              </TabsContent>

              <TabsContent value="resolved" className="m-0">
                {renderBlockersList(resolvedBlockers)}
              </TabsContent>

              <TabsContent value="all" className="m-0">
                {!blockers || blockers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No blockers</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      No blockers have been raised for this project
                    </p>
                    <Link href={`/projects/${id}/blockers/new`}>
                      <Button>Raise Blocker</Button>
                    </Link>
                  </div>
                ) : (
                  renderBlockersList(blockers)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
