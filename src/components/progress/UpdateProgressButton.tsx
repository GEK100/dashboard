"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import type { ActivityStatus, RagStatus } from "@/types/database"

interface UpdateProgressButtonProps {
  activityId: string
  projectId: string
  activityName: string
  currentProgress: number
}

export function UpdateProgressButton({
  activityId,
  projectId,
  activityName,
  currentProgress,
}: UpdateProgressButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(currentProgress)
  const [notes, setNotes] = useState("")

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Determine status based on progress
      let status: ActivityStatus = "in_progress"
      if (progress === 0) {
        status = "not_started"
      } else if (progress === 100) {
        status = "complete"
      }

      // Determine RAG status (simple logic - can be customized)
      let ragStatus: RagStatus = "grey"
      if (progress > 0 && progress < 100) {
        ragStatus = "green" // In progress and on track (simplified)
      } else if (progress === 100) {
        ragStatus = "green"
      }

      // Create progress update record
      await supabase.from("progress_updates").insert({
        activity_id: activityId,
        project_id: projectId,
        percent_complete: progress,
        notes: notes || null,
        photos: [],
        updated_by: user.id,
      } as never)

      // Update the activity
      const updateData: Record<string, unknown> = {
        percent_complete: progress,
        status,
        rag_status: ragStatus,
        updated_at: new Date().toISOString(),
      }

      // Set actual_start if starting progress
      if (currentProgress === 0 && progress > 0) {
        updateData.actual_start = new Date().toISOString().split("T")[0]
      }

      // Set actual_finish if completing
      if (progress === 100) {
        updateData.actual_finish = new Date().toISOString().split("T")[0]
      }

      await supabase
        .from("programme_activities")
        .update(updateData as never)
        .eq("id", activityId)

      toast.success("Progress updated successfully")
      setOpen(false)
      setNotes("")
      router.refresh()
    } catch (error) {
      console.error("Error updating progress:", error)
      toast.error("Failed to update progress")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Update progress for {activityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <span className="text-2xl font-bold">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
