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
  FileCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, RamsPackage, RamsSubmission, ProjectRole } from "@/types/database"
import { CopyUploadLink } from "@/components/rams/CopyUploadLink"

interface RamsPageProps {
  params: Promise<{ id: string }>
}

export default async function RamsPage({ params }: RamsPageProps) {
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

  // Fetch RAMS packages
  const { data: packagesData } = await supabase
    .from("rams_packages")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  const packages = packagesData as RamsPackage[] | null

  // Fetch pending submissions
  const { data: submissionsData } = await supabase
    .from("rams_submissions")
    .select("*")
    .eq("project_id", id)
    .eq("pm_status", "pending")
    .order("submitted_at", { ascending: false })

  const pendingSubmissions = submissionsData as RamsSubmission[] | null

  // Calculate counts
  const awaitingPackages = packages?.filter((p) => p.status === "awaiting") || []
  const submittedPackages = packages?.filter((p) => p.status === "submitted") || []
  const approvedPackages = packages?.filter((p) => p.status === "approved") || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "awaiting":
        return <Badge className="bg-amber-500">Awaiting</Badge>
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canManageRams = ["admin", "director", "super_admin"].includes(profile.role) ||
    ["pm", "hs"].includes(projectUser?.role || "")

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
              <h1 className="text-3xl font-bold tracking-tight">RAMS Management</h1>
              <p className="text-muted-foreground">
                Risk assessments and method statements
              </p>
            </div>

            {canManageRams && (
              <Link href={`/projects/${id}/rams/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Package
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
                  <p className="text-2xl font-bold">{awaitingPackages.length}</p>
                  <p className="text-sm text-muted-foreground">Awaiting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={pendingSubmissions && pendingSubmissions.length > 0 ? "border-blue-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Eye className={`h-8 w-8 ${pendingSubmissions && pendingSubmissions.length > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${pendingSubmissions && pendingSubmissions.length > 0 ? "text-blue-600" : ""}`}>
                    {pendingSubmissions?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileCheck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{submittedPackages.length}</p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{approvedPackages.length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews Alert */}
        {pendingSubmissions && pendingSubmissions.length > 0 && canManageRams && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Eye className="h-5 w-5" />
                Submissions Pending Review ({pendingSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/projects/${id}/rams/review/${submission.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {submission.package_name || "RAMS Submission"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {submission.subcontractor_company || "Unknown subcontractor"} -{" "}
                      {formatDistanceToNow(new Date(submission.submitted_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button size="sm">
                    Review
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Packages List */}
        <Card>
          <CardHeader>
            <CardTitle>RAMS Packages</CardTitle>
            <CardDescription>
              {packages?.length || 0} total packages
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
                    All ({packages?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="awaiting"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Awaiting ({awaitingPackages.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                  >
                    Approved ({approvedPackages.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0">
                {!packages || packages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No RAMS packages yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create a package to request RAMS from subcontractors
                    </p>
                    {canManageRams && (
                      <Link href={`/projects/${id}/rams/new`}>
                        <Button>Create Package</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              pkg.status === "approved"
                                ? "bg-green-100 text-green-600"
                                : pkg.status === "submitted"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{pkg.package_name}</p>
                              {getStatusBadge(pkg.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {pkg.scope_description || "No description"}
                            </p>
                            {pkg.deadline && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Deadline: {format(new Date(pkg.deadline), "d MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkg.status === "awaiting" && pkg.upload_token && (
                            <CopyUploadLink
                              token={pkg.upload_token}
                              projectId={id}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="awaiting" className="m-0">
                {awaitingPackages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No packages awaiting submission
                  </div>
                ) : (
                  <div className="divide-y">
                    {awaitingPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{pkg.package_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pkg.scope_description || "No description"}
                          </p>
                        </div>
                        {pkg.upload_token && (
                          <CopyUploadLink
                            token={pkg.upload_token}
                            projectId={id}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="m-0">
                {approvedPackages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No approved packages
                  </div>
                ) : (
                  <div className="divide-y">
                    {approvedPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{pkg.package_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {pkg.scope_description || "No description"}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">Approved</Badge>
                      </div>
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
