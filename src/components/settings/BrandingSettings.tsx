"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Upload, X } from "lucide-react"
import { toast } from "sonner"
import type { Company } from "@/types/database"
import Image from "next/image"

interface BrandingSettingsProps {
  company: Company
}

export function BrandingSettings({ company }: BrandingSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    primary_color: company.primary_color,
    secondary_color: company.secondary_color,
    logo_url: company.logo_url,
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB")
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()

      // Upload to Supabase Storage
      const fileName = `${company.id}/logo.${file.name.split(".").pop()}`
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-assets")
        .getPublicUrl(fileName)

      setFormData((prev) => ({ ...prev, logo_url: publicUrl }))
      toast.success("Logo uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo_url: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      await supabase
        .from("companies")
        .update({
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url,
        } as never)
        .eq("id", company.id)

      toast.success("Branding saved successfully")
      router.refresh()
    } catch (error) {
      console.error("Error saving branding:", error)
      toast.error("Failed to save branding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo */}
      <div className="space-y-4">
        <Label>Company Logo</Label>
        <div className="flex items-center gap-4">
          {formData.logo_url ? (
            <div className="relative">
              <Image
                src={formData.logo_url}
                alt="Company logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex h-20 w-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <span className="text-sm text-muted-foreground">No logo</span>
            </div>
          )}
          <div>
            <label htmlFor="logo-upload">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Logo
                </span>
              </Button>
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PNG or JPG, max 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Brand Colors</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                className="w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for primary buttons and accents
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))
                }
                className="w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.secondary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))
                }
                placeholder="#1e40af"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for secondary elements
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Preview</h3>
        <div className="rounded-lg border p-6 bg-muted/50">
          <div className="flex items-center gap-4 mb-4">
            {formData.logo_url ? (
              <Image
                src={formData.logo_url}
                alt="Preview logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div
                className="text-xl font-bold"
                style={{ color: formData.primary_color }}
              >
                {company.name}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded text-white text-sm font-medium"
              style={{ backgroundColor: formData.primary_color }}
            >
              Primary Button
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded text-white text-sm font-medium"
              style={{ backgroundColor: formData.secondary_color }}
            >
              Secondary Button
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-6">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Branding
        </Button>
      </div>
    </form>
  )
}
