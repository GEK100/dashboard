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
  FileImage,
  ExternalLink,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { format, isPast } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, Drawing, ProjectRole, DrawingStatus } from "@/types/database"

interface DrawingsPageProps {
  params: Promise<{ id: string }>
}

export default async function DrawingsPage({ params }: DrawingsPageProps) {
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

  // Fetch drawings
  const { data: drawingsData } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .order("drawing_number", { ascending: true })

  const drawings = drawingsData as Drawing[] | null

  // Stats
  const totalDrawings = drawings?.length || 0
  const forConstruction = drawings?.filter((d) => d.status === "for_construction").length || 0
  const forApproval = drawings?.filter((d) => d.status === "for_approval").length || 0
  const overdue = drawings?.filter(
    (d) => d.next_revision_due && isPast(new Date(d.next_revision_due))
  ).length || 0

  // Get unique disciplines
  const disciplines = [...new Set(drawings?.map((d) => d.discipline).filter(Boolean))] as string[]

  const getStatusBadge = (status: DrawingStatus) => {
    switch (status) {
      case "preliminary":
        return <Badge variant="outline">Preliminary</Badge>
      case "for_approval":
        return <Badge className="bg-amber-500">For Approval</Badge>
      case "for_construction":
        return <Badge className="bg-green-500">For Construction</Badge>
      case "as_built":
        return <Badge className="bg-blue-500">As Built</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderDrawingsList = (drawingsList: typeof drawings) => {
    if (!drawingsList || drawingsList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No drawings in this category
        </div>
      )
    }

    return (
      <div className="divide-y">
        {drawingsList.map((drawing) => {
          const isOverdue = drawing.next_revision_due && isPast(new Date(drawing.next_revision_due))

          return (
            <div
              key={drawing.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileImage className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm">{drawing.drawing_number}</span>
                    {getStatusBadge(drawing.status)}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Revision Due
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium truncate">{drawing.drawing_title}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    {drawing.discipline && <span>{drawing.discipline}</span>}
                    {drawing.current_revision && (
                      <span>Rev: {drawing.current_revision}</span>
                    )}
                    {drawing.revision_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(drawing.revision_date), "d MMM yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {drawing.file_url && (
                <a
                  href={drawing.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          )
        })}
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
              <h1 className="text-3xl font-bold tracking-tight">Drawings Register</h1>
              <p className="text-muted-foreground">
                Track drawing revisions and status
              </p>
            </div>

            <Link href={`/projects/${id}/drawings/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Drawing
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileImage className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalDrawings}</p>
                  <p className="text-sm text-muted-foreground">Total Drawings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileImage className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{forConstruction}</p>
                  <p className="text-sm text-muted-foreground">For Construction</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileImage className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{forApproval}</p>
                  <p className="text-sm text-muted-foreground">For Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={overdue > 0 ? "border-red-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`h-8 w-8 ${overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${overdue > 0 ? "text-red-600" : ""}`}>{overdue}</p>
                  <p className="text-sm text-muted-foreground">Revision Due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters by Discipline */}
        {disciplines.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mr-2">Filter by discipline:</span>
                {disciplines.map((discipline) => (
                  <Badge key={discipline} variant="outline">
                    {discipline}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawings List */}
        <Card>
          <CardHeader>
            <CardTitle>Drawings</CardTitle>
            <CardDescription>
              {drawings?.length || 0} drawings registered
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <div className="px-6 border-b">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    All ({totalDrawings})
                  </TabsTrigger>
                  <TabsTrigger
                    value="for_construction"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    For Construction ({forConstruction})
                  </TabsTrigger>
                  <TabsTrigger
                    value="for_approval"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    For Approval ({forApproval})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0">
                {!drawings || drawings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No drawings registered</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add drawings to track their revisions
                    </p>
                    <Link href={`/projects/${id}/drawings/new`}>
                      <Button>Add Drawing</Button>
                    </Link>
                  </div>
                ) : (
                  renderDrawingsList(drawings)
                )}
              </TabsContent>

              <TabsContent value="for_construction" className="m-0">
                {renderDrawingsList(drawings?.filter((d) => d.status === "for_construction") || null)}
              </TabsContent>

              <TabsContent value="for_approval" className="m-0">
                {renderDrawingsList(drawings?.filter((d) => d.status === "for_approval") || null)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
