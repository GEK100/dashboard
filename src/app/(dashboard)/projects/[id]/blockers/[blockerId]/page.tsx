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
  AlertTriangle,
  Calendar,
  Clock,
  User,
  CheckCircle,
  MapPin,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"
import { format, isPast } from "date-fns"
import type { Blocker, BlockerStatus, BlockerCategory } from "@/types/database"

interface BlockerDetails extends Blocker {
  user_profiles: { full_name: string } | null
  project_name: string
}

function BlockerDetail() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const blockerId = params.blockerId as string

  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [blocker, setBlocker] = useState<BlockerDetails | null>(null)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState("")

  useEffect(() => {
    const fetchBlocker = async () => {
      const supabase = createClient()

      const { data } = await supabase
        .from("blockers")
        .select(`
          *,
          user_profiles!blockers_raised_by_fkey(full_name),
          projects(name)
        `)
        .eq("id", blockerId)
        .single()

      if (data) {
        const blockerData = data as Blocker & {
          user_profiles: { full_name: string } | null
          projects: { name: string }
        }

        setBlocker({
          ...blockerData,
          project_name: blockerData.projects.name,
        })
      }

      setLoading(false)
    }

    fetchBlocker()
  }, [blockerId])

  const handleResolve = async () => {
    if (!blocker) return

    setResolving(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error } = await supabase
        .from("blockers")
        .update({
          status: "resolved" as BlockerStatus,
          date_resolved: new Date().toISOString().split("T")[0],
          resolution_notes: resolutionNotes || null,
          resolved_by: user.id,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", blockerId)

      if (error) throw error

      toast.success("Blocker resolved successfully")
      router.refresh()
      setShowResolveDialog(false)
      // Refresh the page data
      window.location.reload()
    } catch (error) {
      console.error("Error resolving blocker:", error)
      toast.error("Failed to resolve blocker")
    } finally {
      setResolving(false)
    }
  }

  const handleUpdateStatus = async (newStatus: BlockerStatus) => {
    if (!blocker) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("blockers")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", blockerId)

      if (error) throw error

      toast.success(`Status updated to ${newStatus}`)
      setBlocker((prev) => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const getStatusBadge = (status: BlockerStatus) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-500">Open</Badge>
      case "in_progress":
        return <Badge className="bg-amber-500">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryLabel = (category: BlockerCategory | null) => {
    const labels: Record<string, string> = {
      information: "Information Required",
      access: "Access Issue",
      material: "Material Delay",
      labour: "Labour Issue",
      weather: "Weather",
      client: "Client Decision",
      design: "Design Issue",
      other: "Other",
    }
    return category ? labels[category] || category : "Not specified"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!blocker) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Blocker Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This blocker may have been deleted.
            </p>
            <Link href={`/projects/${projectId}/blockers`}>
              <Button>Back to Blockers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOverdue = blocker.date_due && isPast(new Date(blocker.date_due)) &&
    blocker.status !== "resolved" && blocker.status !== "closed"

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/blockers`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blockers
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-lg text-muted-foreground">
                B-{String(blocker.blocker_number).padStart(3, "0")}
              </span>
              {getStatusBadge(blocker.status)}
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{blocker.title}</h1>
            <p className="text-muted-foreground">{blocker.project_name}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Blocker Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{blocker.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Raised By</p>
                <p className="font-medium">{blocker.user_profiles?.full_name || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date Raised</p>
                <p className="font-medium">{format(new Date(blocker.date_raised), "d MMMM yyyy")}</p>
              </div>
            </div>

            {blocker.category && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{getCategoryLabel(blocker.category)}</p>
                </div>
              </div>
            )}

            {blocker.responsible_party && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Responsible Party</p>
                  <p className="font-medium">{blocker.responsible_party}</p>
                </div>
              </div>
            )}

            {blocker.zone && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Zone</p>
                  <p className="font-medium">{blocker.zone}</p>
                </div>
              </div>
            )}

            {blocker.trade && (
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Trade</p>
                  <p className="font-medium">{blocker.trade}</p>
                </div>
              </div>
            )}

            {blocker.date_due && (
              <div className="flex items-start gap-3">
                <Clock className={`h-5 w-5 mt-0.5 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                    {format(new Date(blocker.date_due), "d MMMM yyyy")}
                  </p>
                </div>
              </div>
            )}

            {blocker.days_delayed !== null && blocker.days_delayed > 0 && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Days Delayed</p>
                  <p className="font-medium text-red-600">{blocker.days_delayed} days</p>
                </div>
              </div>
            )}
          </div>

          {/* Impact */}
          {blocker.impact_description && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Impact</h4>
              <p className="text-muted-foreground">{blocker.impact_description}</p>
            </div>
          )}

          {/* Resolution */}
          {blocker.date_resolved && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Resolution
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Resolved on {format(new Date(blocker.date_resolved), "d MMMM yyyy")}
              </p>
              {blocker.resolution_notes && (
                <p className="text-muted-foreground">{blocker.resolution_notes}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {blocker.status !== "resolved" && blocker.status !== "closed" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Update the blocker status</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {blocker.status === "open" && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus("in_progress")}
              >
                Mark In Progress
              </Button>
            )}
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowResolveDialog(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Resolve Blocker
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Blocker</DialogTitle>
            <DialogDescription>
              Provide resolution details for this blocker.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Resolution Notes</Label>
              <Textarea
                id="resolution_notes"
                placeholder="How was this blocker resolved?"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resolve Blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BlockerDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <BlockerDetail />
    </Suspense>
  )
}
