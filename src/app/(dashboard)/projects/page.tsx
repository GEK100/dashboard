import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  FileQuestion,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { canCreateProject } from "@/lib/permissions"
import type { UserProfile, Project } from "@/types/database"

export default async function ProjectsPage() {
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

  type ProjectWithCounts = Project & {
    project_users: { count: number }[]
    rfis: { count: number }[]
    blockers: { count: number }[]
  }

  const projectsQuery = supabase
    .from("projects")
    .select(`
      *,
      project_users(count),
      rfis(count),
      blockers(count)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  let projectsData
  if (projectIds !== null) {
    if (projectIds.length > 0) {
      const result = await projectsQuery.in("id", projectIds)
      projectsData = result.data
    } else {
      projectsData = []
    }
  } else {
    const result = await projectsQuery
    projectsData = result.data
  }

  const projects = projectsData as ProjectWithCounts[] | null

  const activeProjects = projects?.filter((p) => p.status === "live") || []
  const completedProjects = projects?.filter((p) => p.status !== "live") || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-500">Active</Badge>
      case "practical_completion":
        return <Badge className="bg-blue-500">PC</Badge>
      case "defects":
        return <Badge className="bg-amber-500">Defects</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const ProjectCard = ({ project }: { project: typeof projects extends (infer T)[] | null ? T : never }) => (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{project.name}</CardTitle>
              <CardDescription className="truncate">
                {project.client_name || "No client specified"}
              </CardDescription>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {project.start_date
                  ? format(new Date(project.start_date), "d MMM yyyy")
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Completion</p>
              <p className="font-medium">
                {project.target_completion
                  ? format(new Date(project.target_completion), "d MMM yyyy")
                  : "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {(project.project_users as { count: number }[])?.[0]?.count || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              <span>{(project.rfis as { count: number }[])?.[0]?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {(project.blockers as { count: number }[])?.[0]?.count || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your construction projects
          </p>
        </div>
        {canCreateProject(profile) && (
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({projects?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No active projects</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {canCreateProject(profile)
                    ? "Create your first project to get started"
                    : "You haven't been assigned to any active projects yet"}
                </p>
                {canCreateProject(profile) && (
                  <Link href="/projects/new">
                    <Button>Create Project</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  No completed projects
                </h3>
                <p className="text-muted-foreground text-center">
                  Completed projects will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {!projects || projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No projects</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {canCreateProject(profile)
                    ? "Create your first project to get started"
                    : "You haven't been assigned to any projects yet"}
                </p>
                {canCreateProject(profile) && (
                  <Link href="/projects/new">
                    <Button>Create Project</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
