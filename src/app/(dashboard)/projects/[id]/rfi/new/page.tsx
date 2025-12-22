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
import { Loader2, ArrowLeft, Send } from "lucide-react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"

const TRADES = [
  "Mechanical",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Fire Protection",
  "Structural",
  "Architectural",
  "Civil",
  "General",
  "Other",
]

function NewRfiForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string; rfi_response_days: number } | null>(null)

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    location: "",
    trade: "",
    assigned_to_email: "",
    date_required: "",
  })

  useEffect(() => {
    const fetchProject = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("name, rfi_response_days")
        .eq("id", projectId)
        .single()

      if (data) {
        const projectData = data as { name: string; rfi_response_days: number }
        setProject(projectData)
        // Set default due date based on project settings
        const defaultDueDate = addDays(new Date(), projectData.rfi_response_days)
        setFormData((prev) => ({
          ...prev,
          date_required: format(defaultDueDate, "yyyy-MM-dd"),
        }))
      }
    }

    fetchProject()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get next RFI number using the database function
      const { data: nextNumber } = await supabase
        .rpc("get_next_rfi_number", { p_project_id: projectId } as never)

      // Create RFI
      await supabase.from("rfis").insert({
        project_id: projectId,
        rfi_number: nextNumber || 1,
        subject: formData.subject,
        description: formData.description,
        location: formData.location || null,
        trade: formData.trade || null,
        assigned_to_email: formData.assigned_to_email || null,
        date_required: formData.date_required,
        created_by: user.id,
      } as never)

      toast.success("RFI created successfully")
      router.push(`/projects/${projectId}/rfi`)
    } catch (error) {
      console.error("Error creating RFI:", error)
      toast.error("Failed to create RFI")
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/rfi`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to RFI Register
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New RFI</h1>
        <p className="text-muted-foreground">
          Create a new request for information for {project.name}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>RFI Details</CardTitle>
          <CardDescription>
            Fill in the details for your request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of the request"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of what information is needed..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                rows={5}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Level 2, Room 205"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade">Trade</Label>
                <Select
                  value={formData.trade}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, trade: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assigned_to_email">Assign To (Email)</Label>
                <Input
                  id="assigned_to_email"
                  type="email"
                  placeholder="person@company.com"
                  value={formData.assigned_to_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      assigned_to_email: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The person responsible for responding
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_required">Response Required By *</Label>
                <Input
                  id="date_required"
                  type="date"
                  value={formData.date_required}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_required: e.target.value,
                    }))
                  }
                  required
                  min={format(new Date(), "yyyy-MM-dd")}
                />
                <p className="text-xs text-muted-foreground">
                  Default: {project.rfi_response_days} days from today
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Create RFI
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewRfiPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewRfiForm />
    </Suspense>
  )
}
