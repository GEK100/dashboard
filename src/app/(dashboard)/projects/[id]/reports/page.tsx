import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Download,
  Eye,
  Share2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, WeeklyReport, ProjectRole, RagStatus } from "@/types/database"

interface ReportsPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportsPage({ params }: ReportsPageProps) {
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

  // Fetch weekly reports
  const { data: reportsData } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("project_id", id)
    .order("week_ending", { ascending: false })

  const reports = reportsData as WeeklyReport[] | null

  // Stats
  const totalReports = reports?.length || 0
  const publishedReports = reports?.filter((r) => r.published_at).length || 0
  const sharedWithClient = reports?.filter((r) => r.shared_with_client).length || 0

  const getRagBadge = (rag: RagStatus | null) => {
    switch (rag) {
      case "green":
        return <Badge className="bg-green-500">Green</Badge>
      case "amber":
        return <Badge className="bg-amber-500">Amber</Badge>
      case "red":
        return <Badge className="bg-red-500">Red</Badge>
      default:
        return <Badge variant="outline">N/A</Badge>
    }
  }

  const canManageReports = ["admin", "director", "super_admin"].includes(profile.role) ||
    ["pm"].includes(projectUser?.role || "")

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
              <h1 className="text-3xl font-bold tracking-tight">Weekly Reports</h1>
              <p className="text-muted-foreground">
                Project progress reports
              </p>
            </div>

            {canManageReports && (
              <Link href={`/projects/${id}/reports/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Eye className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{publishedReports}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Share2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{sharedWithClient}</p>
                  <p className="text-sm text-muted-foreground">Shared with Client</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              {reports?.length || 0} weekly reports
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No reports yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first weekly report
                </p>
                {canManageReports && (
                  <Link href={`/projects/${id}/reports/new`}>
                    <Button>Create Report</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/projects/${id}/reports/${report.id}`}
                    className="block hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                Week ending {format(parseISO(report.week_ending), "d MMMM yyyy")}
                              </span>
                              {getRagBadge(report.overall_rag)}
                              {report.published_at && (
                                <Badge variant="outline" className="text-xs">Published</Badge>
                              )}
                              {report.shared_with_client && (
                                <Badge className="bg-blue-500 text-xs">Shared</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {report.report_number && (
                                <span>Report #{report.report_number}</span>
                              )}
                              {report.rfis_raised !== null && (
                                <span>{report.rfis_raised} RFIs raised</span>
                              )}
                              {report.blockers_raised !== null && (
                                <span>{report.blockers_raised} blockers</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {report.pdf_url && (
                          <a
                            href={report.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
