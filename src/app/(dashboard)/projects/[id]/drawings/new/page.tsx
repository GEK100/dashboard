"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { DrawingStatus } from "@/types/database"

function NewDrawingForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    drawing_number: "",
    drawing_title: "",
    discipline: "",
    current_revision: "A",
    status: "preliminary" as DrawingStatus,
  })

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type (PDF only for drawings)
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file")
        return
      }
      // Validate file size (max 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.drawing_number.trim() || !formData.drawing_title.trim()) {
      toast.error("Please fill in the required fields")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      let fileUrl: string | null = null

      // Upload file if selected
      if (file) {
        setUploading(true)
        const fileName = `drawings/${projectId}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(fileName, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from("project-files")
          .getPublicUrl(fileName)

        fileUrl = publicUrl
        setUploading(false)
      }

      const { error } = await supabase.from("drawings").insert({
        project_id: projectId,
        drawing_number: formData.drawing_number,
        drawing_title: formData.drawing_title,
        discipline: formData.discipline || null,
        current_revision: formData.current_revision || "A",
        revision_date: new Date().toISOString().split("T")[0],
        status: formData.status,
        is_overdue: false,
        file_url: fileUrl,
      } as never)

      if (error) throw error

      toast.success("Drawing added successfully")
      router.push(`/projects/${projectId}/drawings`)
    } catch (error) {
      console.error("Error creating drawing:", error)
      toast.error("Failed to add drawing")
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // MOCK_DATA: Discipline options
  const disciplines = [
    "Electrical",
    "Mechanical",
    "Plumbing",
    "HVAC",
    "Fire Protection",
    "Architectural",
    "Structural",
    "Civil",
  ]

  const statuses: { value: DrawingStatus; label: string }[] = [
    { value: "preliminary", label: "Preliminary" },
    { value: "for_approval", label: "For Approval" },
    { value: "for_construction", label: "For Construction" },
    { value: "as_built", label: "As Built" },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/drawings`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Drawings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Drawing</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Drawing Details</CardTitle>
          <CardDescription>
            Register a new drawing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="drawing_number">Drawing Number *</Label>
                <Input
                  id="drawing_number"
                  placeholder="e.g., E-001"
                  value={formData.drawing_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, drawing_number: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_revision">Revision</Label>
                <Input
                  id="current_revision"
                  placeholder="e.g., A"
                  value={formData.current_revision}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, current_revision: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawing_title">Drawing Title *</Label>
              <Input
                id="drawing_title"
                placeholder="e.g., Ground Floor Electrical Layout"
                value={formData.drawing_title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, drawing_title: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, discipline: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline} value={discipline}>
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as DrawingStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Drawing File (PDF)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Max size: 100MB. PDF format only.
              </p>
              {file && (
                <p className="text-sm text-green-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

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
                {uploading ? "Uploading..." : "Add Drawing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewDrawingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewDrawingForm />
    </Suspense>
  )
}
