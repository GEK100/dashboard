import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Users,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  LogIn,
  LogOut,
} from "lucide-react"
import { format, startOfDay, endOfDay, isToday, parseISO, formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import { SignInButton } from "@/components/attendance/SignInButton"
import type { UserProfile, Project, SiteAttendance, ProjectRole } from "@/types/database"

interface AttendancePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function AttendancePage({ params, searchParams }: AttendancePageProps) {
  const { id } = await params
  const { date } = await searchParams
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

  // Selected date (default to today)
  const selectedDate = date ? parseISO(date) : new Date()

  // Fetch attendance records for selected date
  const dayStart = startOfDay(selectedDate).toISOString()
  const dayEnd = endOfDay(selectedDate).toISOString()

  const { data: attendanceData } = await supabase
    .from("site_attendance")
    .select(`
      *,
      user_profiles(full_name, role)
    `)
    .eq("project_id", id)
    .gte("sign_in_time", dayStart)
    .lte("sign_in_time", dayEnd)
    .order("sign_in_time", { ascending: false })

  const attendance = attendanceData as (SiteAttendance & {
    user_profiles: { full_name: string; role: string } | null
  })[] | null

  // Check if current user is signed in today
  const userAttendance = attendance?.find((a) => a.user_id === user.id)
  const isSignedIn = userAttendance && !userAttendance.sign_out_time

  // Stats
  const totalSignedIn = attendance?.length || 0
  const currentlyOnSite = attendance?.filter((a) => !a.sign_out_time).length || 0
  const signedOut = attendance?.filter((a) => a.sign_out_time).length || 0

  const getStatusBadge = (record: typeof attendance extends (infer U)[] | null ? U : never) => {
    if (!record.sign_out_time) {
      return <Badge className="bg-green-500">On Site</Badge>
    }
    if (record.auto_sign_out) {
      return <Badge className="bg-amber-500">Auto Sign-Out</Badge>
    }
    return <Badge variant="outline">Left Site</Badge>
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
              <h1 className="text-3xl font-bold tracking-tight">Site Attendance</h1>
              <p className="text-muted-foreground">
                {isToday(selectedDate)
                  ? "Today's attendance"
                  : format(selectedDate, "EEEE, d MMMM yyyy")}
              </p>
            </div>

            <SignInButton
              projectId={id}
              projectLatitude={project.latitude}
              projectLongitude={project.longitude}
              geofenceRadius={project.geofence_radius}
              isSignedIn={isSignedIn || false}
              attendanceId={userAttendance?.id}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalSignedIn}</p>
                  <p className="text-sm text-muted-foreground">Total Sign-ins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={currentlyOnSite > 0 ? "border-green-200" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <UserCheck className={`h-8 w-8 ${currentlyOnSite > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-2xl font-bold ${currentlyOnSite > 0 ? "text-green-600" : ""}`}>
                    {currentlyOnSite}
                  </p>
                  <p className="text-sm text-muted-foreground">Currently On Site</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{signedOut}</p>
                  <p className="text-sm text-muted-foreground">Left Site</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {isToday(selectedDate) ? "Today" : format(selectedDate, "d MMM")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form className="flex items-center gap-4">
              <input
                type="date"
                name="date"
                defaultValue={format(selectedDate, "yyyy-MM-dd")}
                max={format(new Date(), "yyyy-MM-dd")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" variant="outline">
                View Date
              </Button>
              {!isToday(selectedDate) && (
                <Link href={`/projects/${id}/attendance`}>
                  <Button variant="outline">Today</Button>
                </Link>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              {attendance?.length || 0} {attendance?.length === 1 ? "record" : "records"} for{" "}
              {isToday(selectedDate) ? "today" : format(selectedDate, "d MMMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!attendance || attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No attendance records</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {isToday(selectedDate)
                    ? "No one has signed in today yet"
                    : "No one signed in on this date"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          !record.sign_out_time
                            ? "bg-green-100 text-green-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {record.user_profiles?.full_name || "Unknown User"}
                          </p>
                          {getStatusBadge(record)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <LogIn className="h-3 w-3" />
                            {format(new Date(record.sign_in_time), "HH:mm")}
                          </span>
                          {record.sign_out_time && (
                            <span className="flex items-center gap-1">
                              <LogOut className="h-3 w-3" />
                              {format(new Date(record.sign_out_time), "HH:mm")}
                            </span>
                          )}
                          {!record.sign_out_time && (
                            <span className="text-green-600">
                              On site for{" "}
                              {formatDistanceToNow(new Date(record.sign_in_time))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <p className="text-muted-foreground capitalize">
                        {record.user_profiles?.role?.replace("_", " ") || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
