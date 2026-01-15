"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, ArrowRight, Check, Building2 } from "lucide-react"
import { toast } from "sonner"

const STEPS = [
  { id: 1, title: "Basic Information", description: "Project name, location, and dates" },
  { id: 2, title: "Client Details", description: "Client information and project type" },
  { id: 3, title: "Risk Profile", description: "Identify project-specific risks" },
  { id: 4, title: "Settings", description: "Configure project settings" },
]

const CLIENT_SECTORS = [
  "NHS",
  "MoJ",
  "Education",
  "Commercial",
  "Private",
  "Government",
  "Other",
]

const PROJECT_TYPES = ["Refurbishment", "New Build", "Fit-out", "Extension", "Renovation"]

const BUILDING_TYPES = [
  "Healthcare",
  "Government",
  "Education",
  "Commercial",
  "Residential",
  "Industrial",
  "Retail",
]

const STANDARD_RISKS = [
  { key: "occupied_building", label: "Occupied Building", description: "Work in an occupied/operational building" },
  { key: "working_at_height", label: "Working at Height", description: "Activities above 2m require fall protection" },
  { key: "hot_works", label: "Hot Works", description: "Welding, cutting, or other flame/spark activities" },
  { key: "live_services", label: "Live Services", description: "Working near live electrical, gas, or water" },
  { key: "asbestos_presence", label: "Asbestos Presence", description: "Known or suspected ACMs on site" },
  { key: "confined_spaces", label: "Confined Spaces", description: "Entry into tanks, ducts, or similar" },
  { key: "public_interface", label: "Public Interface", description: "Work area accessible to public" },
  { key: "manual_handling", label: "Manual Handling", description: "Heavy lifting or repetitive tasks" },
  { key: "hazardous_substances", label: "Hazardous Substances", description: "Use of chemicals, paints, or similar" },
  { key: "lifting_operations", label: "Lifting Operations", description: "Crane or hoist operations" },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    reference: "",
    address: "",
    postcode: "",
    start_date: "",
    target_completion: "",
    contract_value: "",

    // Step 2: Client Details
    client_name: "",
    client_contact_name: "",
    client_contact_email: "",
    client_sector: "",
    project_type: "",
    building_type: "",

    // Step 3: Risk Profile
    occupied_building: false,
    working_at_height: false,
    hot_works: false,
    live_services: false,
    asbestos_presence: false,
    confined_spaces: false,
    public_interface: false,
    manual_handling: false,
    hazardous_substances: false,
    lifting_operations: false,

    // Step 4: Settings
    rfi_response_days: 7,
    warning_threshold_days: 2,
    client_portal_enabled: true,
  })

  const updateFormData = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project")
      }

      toast.success("Project created successfully")
      router.push(`/projects/${data.project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== ""
      case 2:
        return true // All optional
      case 3:
        return true // All optional
      case 4:
        return true // Has defaults
      default:
        return true
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up a new construction project in a few steps
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${
                step.id === currentStep
                  ? "text-primary"
                  : step.id < currentStep
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  step.id === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Barnet County Court Refurbishment"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Project Reference</Label>
                <Input
                  id="reference"
                  placeholder="e.g., BC-2024-001"
                  value={formData.reference}
                  onChange={(e) => updateFormData("reference", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Site Address</Label>
                <Textarea
                  id="address"
                  placeholder="Full site address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="e.g., EN5 2TQ"
                  value={formData.postcode}
                  onChange={(e) => updateFormData("postcode", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateFormData("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_completion">Target Completion</Label>
                  <Input
                    id="target_completion"
                    type="date"
                    value={formData.target_completion}
                    onChange={(e) => updateFormData("target_completion", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_value">Contract Value (£)</Label>
                <Input
                  id="contract_value"
                  type="number"
                  placeholder="e.g., 500000"
                  value={formData.contract_value}
                  onChange={(e) => updateFormData("contract_value", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Client Details */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  placeholder="e.g., Ministry of Justice"
                  value={formData.client_name}
                  onChange={(e) => updateFormData("client_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact_name">Client Contact Name</Label>
                <Input
                  id="client_contact_name"
                  placeholder="e.g., John Smith"
                  value={formData.client_contact_name}
                  onChange={(e) => updateFormData("client_contact_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact_email">Client Contact Email</Label>
                <Input
                  id="client_contact_email"
                  type="email"
                  placeholder="e.g., john.smith@moj.gov.uk"
                  value={formData.client_contact_email}
                  onChange={(e) => updateFormData("client_contact_email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_sector">Client Sector</Label>
                <Select
                  value={formData.client_sector}
                  onValueChange={(value) => updateFormData("client_sector", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => updateFormData("project_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building_type">Building Type</Label>
                  <Select
                    value={formData.building_type}
                    onValueChange={(value) => updateFormData("building_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Risk Profile */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable the risks that apply to this project. These will be used
                when reviewing RAMS submissions.
              </p>
              {STANDARD_RISKS.map((risk) => (
                <div
                  key={risk.key}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{risk.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {risk.description}
                    </p>
                  </div>
                  <Switch
                    checked={formData[risk.key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) =>
                      updateFormData(risk.key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rfi_response_days">RFI Response Days</Label>
                <Input
                  id="rfi_response_days"
                  type="number"
                  min={1}
                  max={30}
                  value={formData.rfi_response_days}
                  onChange={(e) =>
                    updateFormData("rfi_response_days", parseInt(e.target.value) || 7)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Default number of days for RFI responses
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning_threshold_days">Warning Threshold Days</Label>
                <Input
                  id="warning_threshold_days"
                  type="number"
                  min={1}
                  max={14}
                  value={formData.warning_threshold_days}
                  onChange={(e) =>
                    updateFormData(
                      "warning_threshold_days",
                      parseInt(e.target.value) || 2
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Days before due date to show warning status
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable Client Portal</p>
                  <p className="text-sm text-muted-foreground">
                    Allow external clients to view project progress
                  </p>
                </div>
                <Switch
                  checked={formData.client_portal_enabled}
                  onCheckedChange={(checked) =>
                    updateFormData("client_portal_enabled", checked)
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={!isStepValid()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading || !isStepValid()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        )}
      </div>
    </div>
  )
}
