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
import { format, addDays } from "date-fns"
import type { BlockerCategory } from "@/types/database"

function NewBlockerForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as BlockerCategory | "",
    zone: "",
    trade: "",
    impact_description: "",
    days_delayed: "",
    responsible_party: "",
    date_due: format(addDays(new Date(), 7), "yyyy-MM-dd"),
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

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in the required fields")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Get next blocker number
      const { data: lastBlocker } = await supabase
        .from("blockers")
        .select("blocker_number")
        .eq("project_id", projectId)
        .order("blocker_number", { ascending: false })
        .limit(1)
        .single()

      const nextNumber = lastBlocker ? (lastBlocker as { blocker_number: number }).blocker_number + 1 : 1

      const { error } = await supabase.from("blockers").insert({
        project_id: projectId,
        blocker_number: nextNumber,
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        zone: formData.zone || null,
        trade: formData.trade || null,
        impact_description: formData.impact_description || null,
        days_delayed: formData.days_delayed ? parseInt(formData.days_delayed) : null,
        responsible_party: formData.responsible_party || null,
        date_raised: new Date().toISOString().split("T")[0],
        date_due: formData.date_due || null,
        status: "open",
        is_overdue: false,
        lesson_captured: false,
        raised_by: user.id,
      } as never)

      if (error) throw error

      toast.success("Blocker raised successfully")
      router.push(`/projects/${projectId}/blockers`)
    } catch (error) {
      console.error("Error creating blocker:", error)
      toast.error("Failed to raise blocker")
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

  // MOCK_DATA: Zone options
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

  // MOCK_DATA: Trade options
  const trades = [
    "Electrical",
    "Mechanical",
    "Plumbing",
    "HVAC",
    "Fire Protection",
    "Controls",
    "General",
  ]

  const categories: { value: BlockerCategory; label: string }[] = [
    { value: "information", label: "Information Required" },
    { value: "access", label: "Access Issue" },
    { value: "material", label: "Material Delay" },
    { value: "labour", label: "Labour Issue" },
    { value: "weather", label: "Weather" },
    { value: "client", label: "Client Decision" },
    { value: "design", label: "Design Issue" },
    { value: "other", label: "Other" },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/blockers`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blockers
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Raise Blocker</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Blocker Details</CardTitle>
          <CardDescription>
            Document the issue blocking progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the blocker"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value as BlockerCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible_party">Responsible Party</Label>
                <Input
                  id="responsible_party"
                  placeholder="e.g., Client, Architect"
                  value={formData.responsible_party}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, responsible_party: e.target.value }))
                  }
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="impact_description">Impact Description</Label>
              <Textarea
                id="impact_description"
                placeholder="What is the impact of this blocker?"
                value={formData.impact_description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, impact_description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="days_delayed">Estimated Days Delayed</Label>
                <Input
                  id="days_delayed"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.days_delayed}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, days_delayed: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_due">Resolution Due Date</Label>
                <Input
                  id="date_due"
                  type="date"
                  value={formData.date_due}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date_due: e.target.value }))
                  }
                  min={format(new Date(), "yyyy-MM-dd")}
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
                Raise Blocker
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewBlockerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewBlockerForm />
    </Suspense>
  )
}
