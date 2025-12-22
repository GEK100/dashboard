"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
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
import type { LessonCategory, LessonType } from "@/types/database"

function NewLessonForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recommendation: "",
    category: "" as LessonCategory | "",
    lesson_type: "" as LessonType | "",
  })

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("company_id")
          .eq("id", user.id)
          .single()
        if (profile) {
          setCompanyId((profile as { company_id: string }).company_id)
        }
      }
    }
    fetchUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim() || !formData.recommendation.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!companyId) {
      toast.error("Company not found")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("lessons_learnt").insert({
        company_id: companyId,
        title: formData.title,
        description: formData.description,
        recommendation: formData.recommendation,
        category: formData.category || null,
        lesson_type: formData.lesson_type || null,
        tags: [],
        vote_count: 0,
        created_by: user?.id || null,
      } as never)

      if (error) throw error

      toast.success("Lesson added successfully")
      router.push("/lessons")
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast.error("Failed to add lesson")
    } finally {
      setLoading(false)
    }
  }

  const categories: { value: LessonCategory; label: string }[] = [
    { value: "design", label: "Design" },
    { value: "procurement", label: "Procurement" },
    { value: "site_management", label: "Site Management" },
    { value: "hs", label: "Health & Safety" },
    { value: "commercial", label: "Commercial" },
    { value: "handover", label: "Handover" },
  ]

  const types: { value: LessonType; label: string }[] = [
    { value: "success", label: "Success - What went well" },
    { value: "improvement", label: "Improvement - Could be better" },
    { value: "risk", label: "Risk - Issue to avoid" },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/lessons"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Lesson</h1>
        <p className="text-muted-foreground">Share knowledge with your team</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Capture a lesson learnt from your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief title for the lesson"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value as LessonCategory }))
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
                <Label htmlFor="lesson_type">Type</Label>
                <Select
                  value={formData.lesson_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, lesson_type: value as LessonType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">What Happened *</Label>
              <Textarea
                id="description"
                placeholder="Describe the situation or event..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation *</Label>
              <Textarea
                id="recommendation"
                placeholder="What should others do differently or continue doing?"
                value={formData.recommendation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, recommendation: e.target.value }))
                }
                rows={4}
                required
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
                Add Lesson
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewLessonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewLessonForm />
    </Suspense>
  )
}
