"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  ArrowLeft,
  FileCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Building2,
  User,
  Mail,
  Calendar,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface SubmissionDetails {
  id: string
  package_id: string
  package_name: string
  subcontractor_company: string
  document_url: string
  document_name: string
  submitted_by_name: string
  submitted_by_email: string
  submitted_at: string
  pm_status: string
  pm_comments: string | null
  reviewed_at: string | null
  project_id: string
  project_name: string
}

function RamsReviewForm() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const submissionId = params.submissionId as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [comments, setComments] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const checkAuthorizationAndFetch = async () => {
      const supabase = createClient()

      // First, check if user has permission to review RAMS
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Check user's role on this project (must be pm or hs)
      const { data: projectRoleData } = await supabase
        .from("project_users")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      const projectRole = projectRoleData as { role: string } | null

      // Also check if user is admin/director at company level
      const { data: userProfileData } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const userProfile = userProfileData as { role: string } | null

      const canReview =
        projectRole?.role === "pm" ||
        projectRole?.role === "hs" ||
        userProfile?.role === "admin" ||
        userProfile?.role === "director"

      if (!canReview) {
        setAuthChecked(true)
        setAuthorized(false)
        setLoading(false)
        return
      }

      setAuthorized(true)
      setAuthChecked(true)

      const { data } = await supabase
        .from("rams_submissions")
        .select(`
          id,
          package_id,
          package_name,
          subcontractor_company,
          document_url,
          document_name,
          submitted_by_name,
          submitted_by_email,
          submitted_at,
          pm_status,
          pm_comments,
          reviewed_at,
          project_id,
          projects(name)
        `)
        .eq("id", submissionId)
        .single()

      if (data) {
        const submissionData = data as {
          id: string
          package_id: string
          package_name: string
          subcontractor_company: string
          document_url: string
          document_name: string
          submitted_by_name: string
          submitted_by_email: string
          submitted_at: string
          pm_status: string
          pm_comments: string | null
          reviewed_at: string | null
          project_id: string
          projects: { name: string }
        }

        setSubmission({
          id: submissionData.id,
          package_id: submissionData.package_id,
          package_name: submissionData.package_name,
          subcontractor_company: submissionData.subcontractor_company,
          document_url: submissionData.document_url,
          document_name: submissionData.document_name,
          submitted_by_name: submissionData.submitted_by_name,
          submitted_by_email: submissionData.submitted_by_email,
          submitted_at: submissionData.submitted_at,
          pm_status: submissionData.pm_status,
          pm_comments: submissionData.pm_comments,
          reviewed_at: submissionData.reviewed_at,
          project_id: submissionData.project_id,
          project_name: submissionData.projects.name,
        })
      }
      setLoading(false)
    }

    checkAuthorizationAndFetch()
  }, [submissionId, projectId, router])

  const handleApprove = async () => {
    if (!submission) return
    setSubmitting(true)

    try {
      const supabase = createClient()

      // Update submission status
      await supabase
        .from("rams_submissions")
        .update({
          pm_status: "approved",
          pm_comments: comments || null,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", submissionId)

      // Update package status to approved
      await supabase
        .from("rams_packages")
        .update({ status: "approved" } as never)
        .eq("id", submission.package_id)

      toast.success("RAMS approved successfully")
      router.push(`/projects/${projectId}/rams`)
    } catch (error) {
      console.error("Error approving RAMS:", error)
      toast.error("Failed to approve RAMS")
    } finally {
      setSubmitting(false)
      setShowApproveDialog(false)
    }
  }

  const handleReject = async () => {
    if (!submission) return
    if (!comments.trim()) {
      toast.error("Please provide feedback for rejection")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Update submission status
      await supabase
        .from("rams_submissions")
        .update({
          pm_status: "rejected",
          pm_comments: comments,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", submissionId)

      // Update package status back to awaiting so they can resubmit
      await supabase
        .from("rams_packages")
        .update({ status: "awaiting" } as never)
        .eq("id", submission.package_id)

      toast.success("RAMS rejected - subcontractor will need to resubmit")
      router.push(`/projects/${projectId}/rams`)
    } catch (error) {
      console.error("Error rejecting RAMS:", error)
      toast.error("Failed to reject RAMS")
    } finally {
      setSubmitting(false)
      setShowRejectDialog(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500">Pending Review</Badge>
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Authorization check - show access denied if user doesn't have permission
  if (authChecked && !authorized) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to review RAMS submissions. Only Project Managers and Health & Safety managers can review RAMS.
            </p>
            <Link href={`/projects/${projectId}/rams`}>
              <Button>Back to RAMS</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Submission Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This submission may have been deleted or you don&apos;t have access.
            </p>
            <Link href={`/projects/${projectId}/rams`}>
              <Button>Back to RAMS</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isReviewed = submission.pm_status !== "pending"

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/rams`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to RAMS
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Review RAMS Submission</h1>
            <p className="text-muted-foreground">{submission.project_name}</p>
          </div>
          {getStatusBadge(submission.pm_status)}
        </div>
      </div>

      {/* Submission Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {submission.package_name}
          </CardTitle>
          <CardDescription>RAMS submission details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Subcontractor</p>
                <p className="font-medium">{submission.subcontractor_company}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted By</p>
                <p className="font-medium">{submission.submitted_by_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Contact Email</p>
                <a
                  href={`mailto:${submission.submitted_by_email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {submission.submitted_by_email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {format(new Date(submission.submitted_at), "d MMMM yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>
          </div>

          {/* Document Link */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Document</p>
                <p className="font-medium">{submission.document_name}</p>
              </div>
              <a
                href={submission.document_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Document
                </Button>
              </a>
            </div>
          </div>

          {/* Review Comments (if already reviewed) */}
          {isReviewed && submission.pm_comments && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Review Comments</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{submission.pm_comments}</p>
              {submission.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reviewed on {format(new Date(submission.reviewed_at), "d MMMM yyyy 'at' HH:mm")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReviewed && (
        <Card>
          <CardHeader>
            <CardTitle>Review Decision</CardTitle>
            <CardDescription>
              Review the document and approve or reject this RAMS submission
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve RAMS
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject & Request Revision
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve RAMS Submission</DialogTitle>
            <DialogDescription>
              Confirm that this RAMS meets all requirements and can be approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comments">Comments (Optional)</Label>
              <Textarea
                id="approve-comments"
                placeholder="Add any approval notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject RAMS Submission</DialogTitle>
            <DialogDescription>
              Provide feedback on what needs to be revised. The subcontractor will need to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comments">Revision Feedback *</Label>
              <Textarea
                id="reject-comments"
                placeholder="Explain what needs to be changed or improved..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                This feedback will help the subcontractor understand what to fix.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !comments.trim()}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject & Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function RamsReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <RamsReviewForm />
    </Suspense>
  )
}
