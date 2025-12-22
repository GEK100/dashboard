import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Search,
  FileQuestion,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, Rfi, ProjectRole } from "@/types/database"
import { canCreateRfi } from "@/lib/permissions"

interface RfiPageProps {
  params: Promise<{ id: string }>
}

export default async function RfiPage({ params }: RfiPageProps) {
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

  // Fetch RFIs
  const { data: rfisData } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", id)
    .order("rfi_number", { ascending: false })

  const rfis = rfisData as Rfi[] | null

  // Calculate counts
  const openRfis = rfis?.filter((r) => r.status === "open") || []
  const respondedRfis = rfis?.filter((r) => r.status === "responded") || []
  const closedRfis = rfis?.filter((r) => r.status === "closed") || []
  const overdueRfis = rfis?.filter((r) => r.is_overdue && r.status === "open") || []

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue && status === "open") {
      return <Badge variant="destructive">Overdue</Badge>
    }
    switch (status) {
      case "open":
        return <Badge className="bg-amber-500">Open</Badge>
      case "responded":
        return <Badge className="bg-blue-500">Responded</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const RfiRow = ({ rfi }: { rfi: Rfi }) => (
    <Link href={`/projects/${id}/rfi/${rfi.id}`}>
      <div className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                rfi.is_overdue && rfi.status === "open"
                  ? "bg-red-100 text-red-600"
                  : rfi.status === "open"
                  ? "bg-amber-100 text-amber-600"
                  : rfi.status === "responded"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <FileQuestion className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">
                RFI-{String(rfi.rfi_number).padStart(3, "0")}
              </span>
              {getStatusBadge(rfi.status, rfi.is_overdue)}
            </div>
            <p className="font-medium truncate max-w-md">{rfi.subject}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {rfi.location && <span>{rfi.location}</span>}
              {rfi.trade && <span>{rfi.trade}</span>}
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">
            Due {format(new Date(rfi.date_required), "d MMM yyyy")}
          </p>
          <p className="text-muted-foreground">
            Raised{" "}
            {formatDistanceToNow(new Date(rfi.date_raised), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  )

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
              <h1 className="text-3xl font-bold tracking-tight">RFI Register</h1>
              <p className="text-muted-foreground">
                Manage requests for information
              </p>
            </div>

            {canCreateRfi(profile.role, projectUser?.role) && (
              <Link href={`/projects/${id}/rfi/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New RFI
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{openRfis.length}</p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={overdueRfis.length > 0 ? "border-red-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`h-8 w-8 ${overdueRfis.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${overdueRfis.length > 0 ? "text-red-600" : ""}`}>
                    {overdueRfis.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileQuestion className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{respondedRfis.length}</p>
                  <p className="text-sm text-muted-foreground">Responded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{closedRfis.length}</p>
                  <p className="text-sm text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RFI List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All RFIs</CardTitle>
                <CardDescription>
                  {rfis?.length || 0} total requests for information
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search RFIs..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <div className="px-6 border-b">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    All ({rfis?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="open"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Open ({openRfis.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="overdue"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Overdue ({overdueRfis.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="closed"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Closed ({closedRfis.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0">
                {!rfis || rfis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No RFIs yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first RFI to start tracking requests
                    </p>
                    {canCreateRfi(profile.role, projectUser?.role) && (
                      <Link href={`/projects/${id}/rfi/new`}>
                        <Button>Create RFI</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {rfis.map((rfi) => (
                      <RfiRow key={rfi.id} rfi={rfi} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="open" className="m-0">
                {openRfis.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No open RFIs
                  </div>
                ) : (
                  <div className="divide-y">
                    {openRfis.map((rfi) => (
                      <RfiRow key={rfi.id} rfi={rfi} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overdue" className="m-0">
                {overdueRfis.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No overdue RFIs
                  </div>
                ) : (
                  <div className="divide-y">
                    {overdueRfis.map((rfi) => (
                      <RfiRow key={rfi.id} rfi={rfi} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed" className="m-0">
                {closedRfis.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No closed RFIs
                  </div>
                ) : (
                  <div className="divide-y">
                    {closedRfis.map((rfi) => (
                      <RfiRow key={rfi.id} rfi={rfi} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
