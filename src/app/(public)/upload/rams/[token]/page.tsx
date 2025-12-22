"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, FileCheck, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface PackageInfo {
  id: string
  package_name: string
  scope_description: string | null
  deadline: string | null
  project_name: string
  company_name: string
}

function RamsUploadForm() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null)

  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    file: null as File | null,
  })

  useEffect(() => {
    const fetchPackageInfo = async () => {
      const supabase = createClient()

      // Fetch package by upload token
      const { data: pkg } = await supabase
        .from("rams_packages")
        .select(`
          id,
          package_name,
          scope_description,
          deadline,
          project_id,
          projects(name, company_id, companies(name))
        `)
        .eq("upload_token", token)
        .eq("status", "awaiting")
        .single()

      if (!pkg) {
        setInvalid(true)
        setLoading(false)
        return
      }

      const packageData = pkg as {
        id: string
        package_name: string
        scope_description: string | null
        deadline: string | null
        projects: {
          name: string
          companies: { name: string }
        }
      }

      setPackageInfo({
        id: packageData.id,
        package_name: packageData.package_name,
        scope_description: packageData.scope_description,
        deadline: packageData.deadline,
        project_name: packageData.projects.name,
        company_name: packageData.projects.companies.name,
      })
      setLoading(false)
    }

    fetchPackageInfo()
  }, [token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF, Word docs)
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document")
        return
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        return
      }
      setFormData((prev) => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!packageInfo) return

    setUploading(true)

    try {
      const supabase = createClient()

      // Upload file to Supabase Storage
      const fileName = `rams/${packageInfo.id}/${Date.now()}_${formData.file.name}`
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(fileName, formData.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("project-files")
        .getPublicUrl(fileName)

      // Get project_id from package
      const { data: pkg } = await supabase
        .from("rams_packages")
        .select("project_id")
        .eq("id", packageInfo.id)
        .single()

      if (!pkg) throw new Error("Package not found")

      const projectId = (pkg as { project_id: string }).project_id

      // Create submission
      await supabase.from("rams_submissions").insert({
        project_id: projectId,
        package_id: packageInfo.id,
        package_name: packageInfo.package_name,
        subcontractor_company: formData.company_name,
        document_url: publicUrl,
        document_name: formData.file.name,
        submitted_by_name: formData.contact_name,
        submitted_by_email: formData.contact_email,
        pm_status: "pending",
      } as never)

      // Update package status
      await supabase
        .from("rams_packages")
        .update({ status: "submitted" } as never)
        .eq("id", packageInfo.id)

      setSubmitted(true)
      toast.success("RAMS submitted successfully")
    } catch (error) {
      console.error("Error submitting RAMS:", error)
      toast.error("Failed to submit RAMS")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This upload link is no longer valid. It may have already been used
              or the RAMS has already been submitted.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">RAMS Submitted Successfully</h2>
            <p className="text-muted-foreground">
              Thank you for submitting your RAMS. The project team will review
              your submission and get back to you if any revisions are required.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-xl w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <FileCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>RAMS Submission</CardTitle>
          <CardDescription>
            Submit your Risk Assessment and Method Statement for{" "}
            <strong>{packageInfo?.company_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Package Info */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">{packageInfo?.package_name}</h3>
            {packageInfo?.scope_description && (
              <p className="text-sm text-muted-foreground mb-2">
                {packageInfo.scope_description}
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Project:</span>{" "}
              {packageInfo?.project_name}
            </p>
            {packageInfo?.deadline && (
              <p className="text-sm">
                <span className="text-muted-foreground">Deadline:</span>{" "}
                {format(new Date(packageInfo.deadline), "d MMMM yyyy")}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Your Company Name *</Label>
              <Input
                id="company_name"
                placeholder="e.g., ABC Electrical Ltd"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Your Name *</Label>
                <Input
                  id="contact_name"
                  placeholder="John Smith"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Your Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">RAMS Document *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, Word (.doc, .docx). Max size: 50MB
              </p>
              {formData.file && (
                <p className="text-sm text-green-600">
                  Selected: {formData.file.name}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Submit RAMS
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RamsUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <RamsUploadForm />
    </Suspense>
  )
}
