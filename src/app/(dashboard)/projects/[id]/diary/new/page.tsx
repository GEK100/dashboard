"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  ArrowLeft,
  Plus,
  Camera,
  MapPin,
  X,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { DiaryCategory } from "@/types/database"

function NewDiaryEntryForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    entry_date: format(new Date(), "yyyy-MM-dd"),
    entry_time: format(new Date(), "HH:mm"),
    category: "" as DiaryCategory | "",
    content: "",
    zone: "",
    location_description: "",
    gps_latitude: null as number | null,
    gps_longitude: null as number | null,
  })

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])

  useEffect(() => {
    const fetchProject = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single()

      if (data) {
        setProject(data as { name: string })
      }
    }

    fetchProject()
  }, [projectId])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude,
        }))
        toast.success("Location captured")
        setGettingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Failed to get location")
        setGettingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: { file: File; preview: string }[] = []

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`)
        return
      }
      // Validate file size (max 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return
      }

      const preview = URL.createObjectURL(file)
      newPhotos.push({ file, preview })
    })

    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev]
      URL.revokeObjectURL(newPhotos[index].preview)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast.error("Please enter diary content")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Upload photos if any
      const photoUrls: string[] = []

      if (photos.length > 0) {
        setUploading(true)

        for (const photo of photos) {
          const fileName = `diary/${projectId}/${Date.now()}_${photo.file.name}`
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(fileName, photo.file)

          if (uploadError) {
            console.error("Photo upload error:", uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from("project-files")
            .getPublicUrl(fileName)

          photoUrls.push(publicUrl)
        }

        setUploading(false)
      }

      // Create diary entry
      const { error } = await supabase.from("diary_entries").insert({
        project_id: projectId,
        entry_date: formData.entry_date,
        entry_time: formData.entry_time + ":00",
        category: formData.category || null,
        content: formData.content,
        zone: formData.zone || null,
        location_description: formData.location_description || null,
        gps_latitude: formData.gps_latitude,
        gps_longitude: formData.gps_longitude,
        photos: photoUrls,
        created_by: user.id,
      } as never)

      if (error) throw error

      toast.success("Diary entry created successfully")
      router.push(`/projects/${projectId}/diary`)
    } catch (error) {
      console.error("Error creating diary entry:", error)
      toast.error("Failed to create diary entry")
    } finally {
      setLoading(false)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // MOCK_DATA: Zone options - should come from project settings
  const zones = [
    "Zone A",
    "Zone B",
    "Zone C",
    "Ground Floor",
    "First Floor",
    "Second Floor",
    "Roof",
    "External",
    "Plant Room",
    "Riser",
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/diary`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Diary
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Diary Entry</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
          <CardDescription>
            Record your site observation or activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Date *</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, entry_date: e.target.value }))
                  }
                  max={format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_time">Time *</Label>
                <Input
                  id="entry_time"
                  type="time"
                  value={formData.entry_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, entry_time: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value as DiaryCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="instruction">Instruction</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="hs">Health & Safety</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Entry Content *</Label>
              <Textarea
                id="content"
                placeholder="Describe what happened, observations, or activities..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={6}
                required
              />
            </div>

            {/* Location */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone/Area</Label>
                <Select
                  value={formData.zone}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, zone: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_description">Location Details</Label>
                <Input
                  id="location_description"
                  placeholder="e.g., Near column C3"
                  value={formData.location_description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location_description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* GPS Location */}
            <div className="space-y-2">
              <Label>GPS Location</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="mr-2 h-4 w-4" />
                  )}
                  Capture Location
                </Button>
                {formData.gps_latitude && formData.gps_longitude && (
                  <span className="text-sm text-muted-foreground">
                    {formData.gps_latitude.toFixed(6)}, {formData.gps_longitude.toFixed(6)}
                  </span>
                )}
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to add photos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max 10MB per image
                  </span>
                </label>
              </div>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading || uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewDiaryEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewDiaryEntryForm />
    </Suspense>
  )
}
