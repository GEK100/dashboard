"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface RfiResponseFormProps {
  rfiId: string
  projectId: string
}

export function RfiResponseForm({ rfiId, projectId }: RfiResponseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [closingWithoutResponse, setClosingWithoutResponse] = useState(false)
  const [response, setResponse] = useState("")

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error("Please enter a response")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await supabase
        .from("rfis")
        .update({
          response: response,
          response_by: user.id,
          date_responded: new Date().toISOString(),
          status: "responded",
        } as never)
        .eq("id", rfiId)

      toast.success("Response submitted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error submitting response:", error)
      toast.error("Failed to submit response")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseWithoutResponse = async () => {
    setClosingWithoutResponse(true)

    try {
      const supabase = createClient()

      await supabase
        .from("rfis")
        .update({
          status: "closed",
        } as never)
        .eq("id", rfiId)

      toast.success("RFI closed")
      router.refresh()
    } catch (error) {
      console.error("Error closing RFI:", error)
      toast.error("Failed to close RFI")
    } finally {
      setClosingWithoutResponse(false)
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter your response to this RFI..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={5}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSubmitResponse}
          disabled={loading || closingWithoutResponse}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Response
        </Button>
        <Button
          variant="outline"
          onClick={handleCloseWithoutResponse}
          disabled={loading || closingWithoutResponse}
        >
          {closingWithoutResponse ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Close Without Response
        </Button>
      </div>
    </div>
  )
}
