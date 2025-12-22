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
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"
import { format, addDays } from "date-fns"

function NewActivityForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)

  const [formData, setFormData] = useState({
    activity_name: "",
    activity_reference: "",
    zone: "",
    trade: "",
    planned_start: format(new Date(), "yyyy-MM-dd"),
    planned_finish: format(addDays(new Date(), 14), "yyyy-MM-dd"),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.activity_name.trim()) {
      toast.error("Please enter an activity name")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("programme_activities").insert({
        project_id: projectId,
        activity_name: formData.activity_name,
        activity_reference: formData.activity_reference || null,
        zone: formData.zone || null,
        trade: formData.trade || null,
        planned_start: formData.planned_start || null,
        planned_finish: formData.planned_finish || null,
        percent_complete: 0,
        status: "not_started",
        rag_status: "grey",
        imported_from_programme: false,
      } as never)

      if (error) throw error

      toast.success("Activity created successfully")
      router.push(`/projects/${projectId}/progress`)
    } catch (error) {
      console.error("Error creating activity:", error)
      toast.error("Failed to create activity")
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

  // MOCK_DATA: Trade options - should come from company or project settings
  const trades = [
    "Electrical",
    "Mechanical",
    "Plumbing",
    "HVAC",
    "Fire Protection",
    "Controls",
    "General",
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/progress`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Progress
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Activity</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>
            Add a new activity to track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="activity_name">Activity Name *</Label>
              <Input
                id="activity_name"
                placeholder="e.g., First Fix Containment"
                value={formData.activity_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, activity_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_reference">Reference (Optional)</Label>
              <Input
                id="activity_reference"
                placeholder="e.g., ACT-001"
                value={formData.activity_reference}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, activity_reference: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
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
                    {trades.map((trade) => (
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
                <Label htmlFor="planned_start">Planned Start</Label>
                <Input
                  id="planned_start"
                  type="date"
                  value={formData.planned_start}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, planned_start: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planned_finish">Planned Finish</Label>
                <Input
                  id="planned_finish"
                  type="date"
                  value={formData.planned_finish}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, planned_finish: e.target.value }))
                  }
                  min={formData.planned_start}
                />
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
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewActivityForm />
    </Suspense>
  )
}
