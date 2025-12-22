"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Trash2,
  Edit,
  BookOpen,
  AlertTriangle,
  CloudSun,
  Truck,
  Users,
  HardHat,
  FileText,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { DiaryCategory, DiaryEntry } from "@/types/database"

interface DiaryEntryDetails extends DiaryEntry {
  user_profiles: { full_name: string } | null
  project_name: string
}

function DiaryEntryDetail() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const entryId = params.entryId as string

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [entry, setEntry] = useState<DiaryEntryDetails | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    const fetchEntry = async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch entry
      const { data } = await supabase
        .from("diary_entries")
        .select(`
          *,
          user_profiles!diary_entries_created_by_fkey(full_name),
          projects(name)
        `)
        .eq("id", entryId)
        .single()

      if (data) {
        const entryData = data as DiaryEntry & {
          user_profiles: { full_name: string } | null
          projects: { name: string }
        }

        setEntry({
          ...entryData,
          project_name: entryData.projects.name,
        })

        // Check if user can edit (is creator)
        setCanEdit(user?.id === entryData.created_by)
      }

      setLoading(false)
    }

    fetchEntry()
  }, [entryId])

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)

    try {
      const supabase = createClient()

      // Delete photos from storage if any
      const photos = entry.photos as string[]
      if (photos && photos.length > 0) {
        for (const photoUrl of photos) {
          // Extract file path from URL
          const urlParts = photoUrl.split("/project-files/")
          if (urlParts[1]) {
            await supabase.storage.from("project-files").remove([urlParts[1]])
          }
        }
      }

      // Delete entry
      const { error } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entryId)

      if (error) throw error

      toast.success("Diary entry deleted")
      router.push(`/projects/${projectId}/diary`)
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast.error("Failed to delete entry")
    } finally {
      setDeleting(false)
    }
  }

  const getCategoryIcon = (cat: DiaryCategory | null) => {
    switch (cat) {
      case "progress":
        return <HardHat className="h-5 w-5" />
      case "issue":
        return <AlertTriangle className="h-5 w-5" />
      case "instruction":
        return <FileText className="h-5 w-5" />
      case "visitor":
        return <Users className="h-5 w-5" />
      case "hs":
        return <AlertTriangle className="h-5 w-5" />
      case "weather":
        return <CloudSun className="h-5 w-5" />
      case "delivery":
        return <Truck className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getCategoryBadge = (cat: DiaryCategory | null) => {
    const categoryLabels: Record<string, string> = {
      progress: "Progress",
      issue: "Issue",
      instruction: "Instruction",
      visitor: "Visitor",
      hs: "Health & Safety",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Entry Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This diary entry may have been deleted.
            </p>
            <Link href={`/projects/${projectId}/diary`}>
              <Button>Back to Diary</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = entry.photos as string[]

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/diary`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Diary
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getCategoryIcon(entry.category)}
              <h1 className="text-3xl font-bold tracking-tight">
                Diary Entry
              </h1>
              {getCategoryBadge(entry.category)}
            </div>
            <p className="text-muted-foreground">{entry.project_name}</p>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Diary Entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The entry and all associated
                      photos will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleting}
                    >
                      {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Entry Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
          <CardDescription>
            {format(new Date(entry.entry_date), "EEEE, d MMMM yyyy")} at{" "}
            {entry.entry_time.slice(0, 5)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(entry.entry_date), "d MMMM yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{entry.entry_time.slice(0, 5)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">
                  {entry.user_profiles?.full_name || "Unknown"}
                </p>
              </div>
            </div>

            {entry.zone && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Zone</p>
                  <p className="font-medium">{entry.zone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {(entry.location_description || entry.gps_latitude) && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              {entry.location_description && (
                <p className="text-sm mb-2">{entry.location_description}</p>
              )}
              {entry.gps_latitude && entry.gps_longitude && (
                <a
                  href={`https://www.google.com/maps?q=${entry.gps_latitude},${entry.gps_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View on Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Content */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Entry Content</h4>
            <p className="whitespace-pre-wrap">{entry.content}</p>
          </div>

          {/* Photos */}
          {photos && photos.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">
                Photos ({photos.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            Entry ID: {entry.id}
            <br />
            Created: {format(new Date(entry.created_at), "d MMM yyyy HH:mm")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DiaryEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <DiaryEntryDetail />
    </Suspense>
  )
}
