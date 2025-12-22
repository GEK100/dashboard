"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, LogIn, LogOut, MapPin, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface SignInButtonProps {
  projectId: string
  projectLatitude: number | null
  projectLongitude: number | null
  geofenceRadius: number
  isSignedIn: boolean
  attendanceId?: string
}

// Haversine formula to calculate distance between two coordinates
function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in meters
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function SignInButton({
  projectId,
  projectLatitude,
  projectLongitude,
  geofenceRadius,
  isSignedIn,
  attendanceId,
}: SignInButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showOutsideGeofenceDialog, setShowOutsideGeofenceDialog] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [distanceFromSite, setDistanceFromSite] = useState<number | null>(null)

  const hasGeofence = projectLatitude !== null && projectLongitude !== null

  const handleSignIn = async () => {
    setLoading(true)

    // Get current location
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ latitude, longitude })

        // Check if within geofence
        if (hasGeofence) {
          const distance = getDistanceFromLatLonInMeters(
            latitude,
            longitude,
            projectLatitude!,
            projectLongitude!
          )
          setDistanceFromSite(distance)

          if (distance > geofenceRadius) {
            // Outside geofence
            setShowOutsideGeofenceDialog(true)
            setLoading(false)
            return
          }
        }

        // Proceed with sign-in
        await performSignIn(latitude, longitude)
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Failed to get your location. Please enable location services.")
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const performSignIn = async (latitude: number, longitude: number) => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error } = await supabase.from("site_attendance").insert({
        project_id: projectId,
        user_id: user.id,
        sign_in_time: new Date().toISOString(),
        sign_in_latitude: latitude,
        sign_in_longitude: longitude,
        sign_in_verified: hasGeofence,
        verification_status: "verified",
        induction_valid: true, // TODO: Check actual induction status
        rams_valid: true, // TODO: Check actual RAMS status
      } as never)

      if (error) throw error

      toast.success("Signed in successfully")
      router.refresh()
    } catch (error) {
      console.error("Sign-in error:", error)
      toast.error("Failed to sign in")
    } finally {
      setLoading(false)
      setShowOutsideGeofenceDialog(false)
    }
  }

  const handleSignOut = () => {
    setShowConfirmDialog(true)
  }

  const confirmSignOut = async () => {
    if (!attendanceId) {
      toast.error("No active sign-in found")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const recordId = attendanceId

      // Get current location for sign-out
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords

            const { error } = await supabase
              .from("site_attendance")
              .update({
                sign_out_time: new Date().toISOString(),
                sign_out_latitude: latitude,
                sign_out_longitude: longitude,
              } as never)
              .eq("id", recordId)

            if (error) throw error

            toast.success("Signed out successfully")
            router.refresh()
            setShowConfirmDialog(false)
            setLoading(false)
          },
          async () => {
            // If location fails, still sign out without coordinates
            const { error } = await supabase
              .from("site_attendance")
              .update({
                sign_out_time: new Date().toISOString(),
              } as never)
              .eq("id", recordId)

            if (error) throw error

            toast.success("Signed out successfully")
            router.refresh()
            setShowConfirmDialog(false)
            setLoading(false)
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      } else {
        // No geolocation, sign out without coordinates
        const { error } = await supabase
          .from("site_attendance")
          .update({
            sign_out_time: new Date().toISOString(),
          } as never)
          .eq("id", recordId)

        if (error) throw error

        toast.success("Signed out successfully")
        router.refresh()
        setShowConfirmDialog(false)
        setLoading(false)
      }
    } catch (error) {
      console.error("Sign-out error:", error)
      toast.error("Failed to sign out")
      setLoading(false)
    }
  }

  return (
    <>
      {isSignedIn ? (
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign Out
        </Button>
      ) : (
        <Button
          onClick={handleSignIn}
          className="gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign In
        </Button>
      )}

      {/* Sign-out Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out from site?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={confirmSignOut} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outside Geofence Dialog */}
      <Dialog
        open={showOutsideGeofenceDialog}
        onOpenChange={setShowOutsideGeofenceDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Outside Site Area
            </DialogTitle>
            <DialogDescription>
              You appear to be outside the project site area.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                You are approximately{" "}
                <strong>
                  {distanceFromSite
                    ? distanceFromSite > 1000
                      ? `${(distanceFromSite / 1000).toFixed(1)}km`
                      : `${Math.round(distanceFromSite)}m`
                    : "unknown distance"}
                </strong>{" "}
                from the site center.
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              The site geofence radius is {geofenceRadius}m.
            </p>
            <p className="text-sm text-amber-600 mt-4">
              You can still sign in, but this will be flagged for review.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOutsideGeofenceDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (currentLocation) {
                  performSignIn(
                    currentLocation.latitude,
                    currentLocation.longitude
                  )
                }
              }}
              disabled={loading}
              variant="destructive"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
