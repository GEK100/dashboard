import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  User,
  MapPin,
  Image as ImageIcon,
  AlertTriangle,
  CloudSun,
  Truck,
  Users,
  HardHat,
  FileText,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns"
import { Sidebar } from "@/components/layout/Sidebar"
import type { UserProfile, Project, DiaryEntry, ProjectRole, DiaryCategory } from "@/types/database"

interface DiaryPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string; category?: string }>
}

export default async function DiaryPage({ params, searchParams }: DiaryPageProps) {
  const { id } = await params
  const { date, category } = await searchParams
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

  // Fetch diary entries
  let query = supabase
    .from("diary_entries")
    .select(`
      *,
      user_profiles!diary_entries_created_by_fkey(full_name)
    `)
    .eq("project_id", id)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: false })

  if (date) {
    query = query.eq("entry_date", date)
  }

  if (category) {
    query = query.eq("category", category)
  }

  const { data: entriesData } = await query.limit(100)

  const entries = entriesData as (DiaryEntry & {
    user_profiles: { full_name: string } | null
  })[] | null

  // Group entries by date
  const entriesByDate = entries?.reduce((acc, entry) => {
    const dateKey = entry.entry_date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(entry)
    return acc
  }, {} as Record<string, typeof entries>) || {}

  // Count entries this week
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const entriesThisWeek = entries?.filter((entry) =>
    isWithinInterval(parseISO(entry.entry_date), { start: weekStart, end: weekEnd })
  ).length || 0

  // Count by category
  const categoryCount = entries?.reduce((acc, entry) => {
    const cat = entry.category || "general"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const getCategoryIcon = (cat: DiaryCategory | null) => {
    switch (cat) {
      case "progress":
        return <HardHat className="h-4 w-4" />
      case "issue":
        return <AlertTriangle className="h-4 w-4" />
      case "instruction":
        return <FileText className="h-4 w-4" />
      case "visitor":
        return <Users className="h-4 w-4" />
      case "hs":
        return <AlertTriangle className="h-4 w-4" />
      case "weather":
        return <CloudSun className="h-4 w-4" />
      case "delivery":
        return <Truck className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getCategoryBadge = (cat: DiaryCategory | null) => {
    const categoryLabels: Record<string, string> = {
      progress: "Progress",
      issue: "Issue",
      instruction: "Instruction",
      visitor: "Visitor",
      hs: "H&S",
      weather: "Weather",
      delivery: "Delivery",
      general: "General",
    }

    const categoryColors: Record<string, string> = {
      progress: "bg-green-500",
      issue: "bg-red-500",
      instruction: "bg-blue-500",
      visitor: "bg-purple-500",
      hs: "bg-amber-500",
      weather: "bg-sky-500",
      delivery: "bg-orange-500",
      general: "bg-gray-500",
    }

    const label = categoryLabels[cat || "general"]
    const color = categoryColors[cat || "general"]

    return <Badge className={color}>{label}</Badge>
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
              <h1 className="text-3xl font-bold tracking-tight">Site Diary</h1>
              <p className="text-muted-foreground">
                Daily records and observations
              </p>
            </div>

            <Link href={`/projects/${id}/diary/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{entries?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{entriesThisWeek}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{categoryCount.issue || 0}</p>
                  <p className="text-sm text-muted-foreground">Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <HardHat className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{categoryCount.progress || 0}</p>
                  <p className="text-sm text-muted-foreground">Progress Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <form action={`/projects/${id}/diary`} method="GET">
                  <Input
                    type="date"
                    name="date"
                    defaultValue={date || ""}
                    className="w-full"
                  />
                </form>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Link href={`/projects/${id}/diary`}>
                  <Button variant={!category ? "default" : "outline"} size="sm">
                    All
                  </Button>
                </Link>
                <Link href={`/projects/${id}/diary?category=progress`}>
                  <Button variant={category === "progress" ? "default" : "outline"} size="sm">
                    Progress
                  </Button>
                </Link>
                <Link href={`/projects/${id}/diary?category=issue`}>
                  <Button variant={category === "issue" ? "default" : "outline"} size="sm">
                    Issues
                  </Button>
                </Link>
                <Link href={`/projects/${id}/diary?category=hs`}>
                  <Button variant={category === "hs" ? "default" : "outline"} size="sm">
                    H&S
                  </Button>
                </Link>
                <Link href={`/projects/${id}/diary?category=delivery`}>
                  <Button variant={category === "delivery" ? "default" : "outline"} size="sm">
                    Deliveries
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <Card>
          <CardHeader>
            <CardTitle>Diary Entries</CardTitle>
            <CardDescription>
              {Object.keys(entriesByDate).length} days with entries
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!entries || entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No diary entries yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start documenting your daily site activities
                </p>
                <Link href={`/projects/${id}/diary/new`}>
                  <Button>Create First Entry</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(entriesByDate).map(([dateKey, dayEntries]) => (
                  <div key={dateKey}>
                    {/* Date Header */}
                    <div className="bg-muted/50 px-4 py-2 sticky top-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(dateKey), "EEEE, d MMMM yyyy")}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          {dayEntries?.length} {dayEntries?.length === 1 ? "entry" : "entries"}
                        </Badge>
                      </div>
                    </div>

                    {/* Day Entries */}
                    {dayEntries?.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/projects/${id}/diary/${entry.id}`}
                        className="block hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-4 flex gap-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="text-sm font-medium">
                              {entry.entry_time.slice(0, 5)}
                            </div>
                            <div className="mt-1">
                              {getCategoryIcon(entry.category)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryBadge(entry.category)}
                              {entry.zone && (
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {entry.zone}
                                </Badge>
                              )}
                              {(entry.photos as string[])?.length > 0 && (
                                <Badge variant="outline">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  {(entry.photos as string[]).length}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm line-clamp-2">{entry.content}</p>

                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.user_profiles?.full_name || "Unknown"}
                              </span>
                              {entry.location_description && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {entry.location_description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
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
