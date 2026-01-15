import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react"
import { format } from "date-fns"
import type { UserProfile, LessonLearnt, LessonCategory, LessonType } from "@/types/database"
import { sanitizeSearchInput } from "@/lib/security"

interface LessonsPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { category, search } = await searchParams
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
    .select("*, companies(name)")
    .eq("id", user.id)
    .single()

  const profile = profileData as (UserProfile & { companies: { name: string } }) | null

  if (!profile) {
    redirect("/login")
  }

  if (!profile.company_id) {
    redirect("/setup")
  }

  const companyId = profile.company_id

  // Fetch lessons
  let query = supabase
    .from("lessons_learnt")
    .select(`
      *,
      user_profiles(full_name),
      projects(name)
    `)
    .eq("company_id", companyId)
    .order("vote_count", { ascending: false })

  if (category) {
    query = query.eq("category", category)
  }

  if (search) {
    const sanitizedSearch = sanitizeSearchInput(search)
    if (sanitizedSearch) {
      query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
    }
  }

  const { data: lessonsData } = await query.limit(50)

  const lessons = lessonsData as (LessonLearnt & {
    user_profiles: { full_name: string } | null
    projects: { name: string } | null
  })[] | null

  // Stats
  const totalLessons = lessons?.length || 0
  const successLessons = lessons?.filter((l) => l.lesson_type === "success").length || 0
  const improvementLessons = lessons?.filter((l) => l.lesson_type === "improvement").length || 0
  const riskLessons = lessons?.filter((l) => l.lesson_type === "risk").length || 0

  const getCategoryBadge = (cat: LessonCategory | null) => {
    const labels: Record<string, string> = {
      design: "Design",
      procurement: "Procurement",
      site_management: "Site Management",
      hs: "Health & Safety",
      commercial: "Commercial",
      handover: "Handover",
    }
    if (!cat) return null
    return <Badge variant="outline">{labels[cat] || cat}</Badge>
  }

  const getTypeBadge = (type: LessonType | null) => {
    switch (type) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>
      case "improvement":
        return <Badge className="bg-amber-500">Improvement</Badge>
      case "risk":
        return <Badge className="bg-red-500">Risk</Badge>
      default:
        return null
    }
  }

  const getTypeIcon = (type: LessonType | null) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "improvement":
        return <TrendingUp className="h-5 w-5 text-amber-500" />
      case "risk":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lessons Learnt</h1>
            <p className="text-muted-foreground">
              Knowledge base from {profile.companies?.name || "your company"}
            </p>
          </div>

          <Link href="/lessons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Lightbulb className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalLessons}</p>
                <p className="text-sm text-muted-foreground">Total Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{successLessons}</p>
                <p className="text-sm text-muted-foreground">Successes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{improvementLessons}</p>
                <p className="text-sm text-muted-foreground">Improvements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{riskLessons}</p>
                <p className="text-sm text-muted-foreground">Risks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <form className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search lessons..."
                  defaultValue={search || ""}
                  className="pl-9"
                />
              </div>
            </form>

            <div className="flex gap-2 flex-wrap">
              <Link href="/lessons">
                <Button variant={!category ? "default" : "outline"} size="sm">
                  All
                </Button>
              </Link>
              <Link href="/lessons?category=design">
                <Button variant={category === "design" ? "default" : "outline"} size="sm">
                  Design
                </Button>
              </Link>
              <Link href="/lessons?category=site_management">
                <Button variant={category === "site_management" ? "default" : "outline"} size="sm">
                  Site Management
                </Button>
              </Link>
              <Link href="/lessons?category=commercial">
                <Button variant={category === "commercial" ? "default" : "outline"} size="sm">
                  Commercial
                </Button>
              </Link>
              <Link href="/lessons?category=hs">
                <Button variant={category === "hs" ? "default" : "outline"} size="sm">
                  H&S
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>
            Sorted by most helpful
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!lessons || lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No lessons yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start capturing lessons to build your knowledge base
              </p>
              <Link href="/lessons/new">
                <Button>Add Lesson</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(lesson.lesson_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium">{lesson.title}</p>
                          {getTypeBadge(lesson.lesson_type)}
                          {getCategoryBadge(lesson.category)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {lesson.vote_count} votes
                          </span>
                          {lesson.projects && (
                            <span>From: {lesson.projects.name}</span>
                          )}
                          <span>
                            {format(new Date(lesson.created_at), "d MMM yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
