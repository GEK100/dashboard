"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"
import { format, addDays } from "date-fns"

function NewRamsPackageForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)

  const [formData, setFormData] = useState({
    package_name: "",
    scope_description: "",
    deadline: format(addDays(new Date(), 14), "yyyy-MM-dd"),
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
    setLoading(true)

    try {
      const supabase = createClient()

      // Generate unique upload token
      const uploadToken = crypto.randomUUID()

      // Create package
      await supabase.from("rams_packages").insert({
        project_id: projectId,
        package_name: formData.package_name,
        scope_description: formData.scope_description || null,
        deadline: formData.deadline || null,
        upload_token: uploadToken,
        status: "awaiting",
      } as never)

      toast.success("RAMS package created successfully")
      router.push(`/projects/${projectId}/rams`)
    } catch (error) {
      console.error("Error creating RAMS package:", error)
      toast.error("Failed to create RAMS package")
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
          href={`/projects/${projectId}/rams`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to RAMS
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New RAMS Package</h1>
        <p className="text-muted-foreground">
          Create a RAMS package for {project.name}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
          <CardDescription>
            Define the RAMS package requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="package_name">Package Name *</Label>
              <Input
                id="package_name"
                placeholder="e.g., First Fix Electrical Installation"
                value={formData.package_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, package_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope_description">Scope Description</Label>
              <Textarea
                id="scope_description"
                placeholder="Describe the scope of work for this RAMS..."
                value={formData.scope_description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scope_description: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Submission Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
                min={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-muted-foreground">
                When the RAMS should be submitted by
              </p>
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
                Create Package
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. A unique upload link will be generated for this package</li>
            <li>2. Share the link with the subcontractor</li>
            <li>3. They can upload their RAMS document via the link</li>
            <li>4. You&apos;ll be notified when a submission is received</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewRamsPackagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NewRamsPackageForm />
    </Suspense>
  )
}
