import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  User,
  FileQuestion,
  CheckCircle,
  AlertTriangle,
  Edit,
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, Rfi, ProjectRole } from "@/types/database"
import { RfiResponseForm } from "@/components/rfi/RfiResponseForm"

interface RfiDetailPageProps {
  params: Promise<{ id: string; rfiId: string }>
}

export default async function RfiDetailPage({ params }: RfiDetailPageProps) {
  const { id: projectId, rfiId } = await params
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
    .eq("id", projectId)
    .single()

  const project = projectData as Project | null

  if (!project) {
    notFound()
  }

  // Get user's project role
  const { data: projectUserData } = await supabase
    .from("project_users")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single()

  const projectUser = projectUserData as { role: ProjectRole } | null

  // Fetch RFI
  const { data: rfiData } = await supabase
    .from("rfis")
    .select("*")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single()

  const rfi = rfiData as Rfi | null

  if (!rfi) {
    notFound()
  }

  // Fetch created by user info
  let createdByName = "Unknown"
  if (rfi.created_by) {
    const { data: creatorData } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", rfi.created_by)
      .single()
    if (creatorData) {
      createdByName = (creatorData as { full_name: string }).full_name
    }
  }

  // Fetch response by user info
  let responseByName = null
  if (rfi.response_by) {
    const { data: responderData } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", rfi.response_by)
      .single()
    if (responderData) {
      responseByName = (responderData as { full_name: string }).full_name
    }
  }

  const getStatusBadge = () => {
    if (rfi.is_overdue && rfi.status === "open") {
      return <Badge variant="destructive" className="text-base px-4 py-1">Overdue</Badge>
    }
    switch (rfi.status) {
      case "open":
        return <Badge className="bg-amber-500 text-base px-4 py-1">Open</Badge>
      case "responded":
        return <Badge className="bg-blue-500 text-base px-4 py-1">Responded</Badge>
      case "closed":
        return <Badge variant="secondary" className="text-base px-4 py-1">Closed</Badge>
      default:
        return <Badge variant="outline" className="text-base px-4 py-1">{rfi.status}</Badge>
    }
  }

  const canRespond = ["admin", "director", "super_admin"].includes(profile.role) ||
    projectUser?.role === "pm"

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar
        projectId={projectId}
        projectName={project.name}
        userRole={profile.role}
        projectRole={projectUser?.role}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${projectId}/rfi`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFI Register
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg text-muted-foreground">
                  RFI-{String(rfi.rfi_number).padStart(3, "0")}
                </span>
                {getStatusBadge()}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{rfi.subject}</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{rfi.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Response Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rfi.response ? (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{rfi.response}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                      <User className="h-4 w-4" />
                      <span>
                        Responded by {responseByName || "Unknown"}{" "}
                        {rfi.date_responded &&
                          formatDistanceToNow(new Date(rfi.date_responded), {
                            addSuffix: true,
                          })}
                      </span>
                    </div>
                  </div>
                ) : rfi.status === "closed" ? (
                  <p className="text-muted-foreground">
                    This RFI was closed without a response.
                  </p>
                ) : canRespond ? (
                  <RfiResponseForm rfiId={rfi.id} projectId={projectId} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Awaiting response</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {rfi.is_overdue && rfi.status === "open" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : rfi.status === "open" ? (
                    <Clock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {rfi.is_overdue && rfi.status === "open"
                        ? "Overdue"
                        : rfi.status === "open"
                        ? "Awaiting Response"
                        : rfi.status === "responded"
                        ? "Response Received"
                        : "Closed"}
                    </p>
                    {rfi.status === "open" && (
                      <p className="text-sm text-muted-foreground">
                        {isPast(new Date(rfi.date_required))
                          ? `Was due ${format(new Date(rfi.date_required), "d MMM yyyy")}`
                          : `Due ${format(new Date(rfi.date_required), "d MMM yyyy")}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date Raised</p>
                    <p className="font-medium">
                      {format(new Date(rfi.date_raised), "d MMMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Response Required</p>
                    <p className={`font-medium ${rfi.is_overdue && rfi.status === "open" ? "text-red-600" : ""}`}>
                      {format(new Date(rfi.date_required), "d MMMM yyyy")}
                    </p>
                  </div>
                </div>

                {rfi.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{rfi.location}</p>
                    </div>
                  </div>
                )}

                {rfi.trade && (
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Trade</p>
                      <p className="font-medium">{rfi.trade}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Raised By</p>
                    <p className="font-medium">{createdByName}</p>
                  </div>
                </div>

                {rfi.assigned_to_email && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{rfi.assigned_to_email}</p>
                    </div>
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
