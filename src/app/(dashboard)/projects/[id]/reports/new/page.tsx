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
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"
import { format, subDays, endOfWeek, startOfWeek } from "date-fns"
import type { RagStatus } from "@/types/database"

function NewReportForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)

  // Default to last Sunday
  const lastSunday = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 })

  const [formData, setFormData] = useState({
    week_ending: format(lastSunday, "yyyy-MM-dd"),
    executive_summary: "",
    progress_summary: "",
    issues_summary: "",
    lookahead_summary: "",
    overall_rag: "green" as RagStatus,
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

    if (!formData.week_ending) {
      toast.error("Please select a week ending date")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get next report number
      const { data: lastReport } = await supabase
        .from("weekly_reports")
        .select("report_number")
        .eq("project_id", projectId)
        .order("report_number", { ascending: false })
        .limit(1)
        .single()

      const nextNumber = lastReport ? ((lastReport as { report_number: number | null }).report_number || 0) + 1 : 1

      const { error } = await supabase.from("weekly_reports").insert({
        project_id: projectId,
        week_ending: formData.week_ending,
        report_number: nextNumber,
        executive_summary: formData.executive_summary || null,
        progress_summary: formData.progress_summary || null,
        issues_summary: formData.issues_summary || null,
        lookahead_summary: formData.lookahead_summary || null,
        overall_rag: formData.overall_rag,
        shared_with_client: false,
        selected_photos: [],
      } as never)

      if (error) throw error

      toast.success("Report created successfully")
      router.push(`/projects/${projectId}/reports`)
    } catch (error) {
      console.error("Error creating report:", error)
      toast.error("Failed to create report")
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
          href={`/projects/${projectId}/reports`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Weekly Report</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Create a new weekly progress report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="week_ending">Week Ending *</Label>
                <Input
                  id="week_ending"
                  type="date"
                  value={formData.week_ending}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, week_ending: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall_rag">Overall RAG Status</Label>
                <Select
                  value={formData.overall_rag}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, overall_rag: value as RagStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green - On Track</SelectItem>
                    <SelectItem value="amber">Amber - At Risk</SelectItem>
                    <SelectItem value="red">Red - Critical Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="executive_summary">Executive Summary</Label>
              <Textarea
                id="executive_summary"
                placeholder="High-level summary for stakeholders..."
                value={formData.executive_summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, executive_summary: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress_summary">Progress Summary</Label>
              <Textarea
                id="progress_summary"
                placeholder="Summary of work completed this week..."
                value={formData.progress_summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, progress_summary: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issues_summary">Issues & Blockers</Label>
              <Textarea
                id="issues_summary"
                placeholder="Key issues and blockers..."
                value={formData.issues_summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, issues_summary: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookahead_summary">Lookahead</Label>
              <Textarea
                id="lookahead_summary"
                placeholder="Planned activities for next week..."
                value={formData.lookahead_summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lookahead_summary: e.target.value }))
                }
                rows={3}
              />
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
                Create Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Report Generation</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered report generation is coming soon. For now, reports are created manually.
            You can publish and share reports with clients after creation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewReportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewReportForm />
    </Suspense>
  )
}
