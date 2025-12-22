"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CopyUploadLinkProps {
  token: string
  projectId: string
}

export function CopyUploadLink({ token, projectId }: CopyUploadLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const uploadUrl = `${window.location.origin}/upload/rams/${token}`

    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      toast.success("Upload link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Upload Link
        </>
      )}
    </Button>
  )
}
