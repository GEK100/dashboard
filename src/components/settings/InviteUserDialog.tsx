"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface InviteUserDialogProps {
  companyId: string
}

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "director", label: "Director" },
  { value: "pm", label: "Project Manager" },
  { value: "site_super", label: "Site Supervisor" },
  { value: "qs", label: "QS" },
  { value: "hs", label: "H&S" },
  { value: "viewer", label: "Viewer" },
]

export function InviteUserDialog({ companyId }: InviteUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "viewer",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Create user profile with pending status
      // Note: In production, you'd also send an invitation email
      // For now, we create the profile so when they sign up, they'll be linked

      // First check if user already exists
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", formData.email)
        .single()

      if (existingUser) {
        toast.error("A user with this email already exists")
        setLoading(false)
        return
      }

      // Create invitation (in real app, use Supabase Auth invite)
      // For MVP, we'll create a user profile that gets linked on signup
      await supabase.from("user_profiles").insert({
        id: crypto.randomUUID(),
        email: formData.email,
        full_name: formData.full_name,
        company_id: companyId,
        role: formData.role,
      } as never)

      toast.success(`Invitation sent to ${formData.email}`)
      setOpen(false)
      setFormData({ email: "", full_name: "", role: "viewer" })
      router.refresh()
    } catch (error) {
      console.error("Error inviting user:", error)
      toast.error("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your company
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="John Smith"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
