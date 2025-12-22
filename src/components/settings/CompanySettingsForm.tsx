"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import type { Company } from "@/types/database"

interface CompanySettingsFormProps {
  company: Company
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name,
    default_rfi_days: company.default_rfi_days,
    default_warning_days: company.default_warning_days,
    client_portal_enabled: company.client_portal_enabled,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      await supabase
        .from("companies")
        .update({
          name: formData.name,
          default_rfi_days: formData.default_rfi_days,
          default_warning_days: formData.default_warning_days,
          client_portal_enabled: formData.client_portal_enabled,
        } as never)
        .eq("id", company.id)

      toast.success("Settings saved successfully")
      router.refresh()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Company Slug</Label>
          <Input
            id="slug"
            value={company.slug}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            This cannot be changed
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Default Settings</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_rfi_days">Default RFI Response Days</Label>
            <Input
              id="default_rfi_days"
              type="number"
              min="1"
              max="90"
              value={formData.default_rfi_days}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  default_rfi_days: parseInt(e.target.value) || 7,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Default number of days for RFI responses
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_warning_days">Warning Threshold Days</Label>
            <Input
              id="default_warning_days"
              type="number"
              min="1"
              max="14"
              value={formData.default_warning_days}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  default_warning_days: parseInt(e.target.value) || 2,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Days before due date to show warnings
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Features</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Client Portal</Label>
            <p className="text-sm text-muted-foreground">
              Enable client portal functionality for projects
            </p>
          </div>
          <Switch
            checked={formData.client_portal_enabled}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, client_portal_enabled: checked }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end border-t pt-6">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
