"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileQuestion,
  FileCheck,
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  FileImage,
  FileText,
  Settings,
  ExternalLink,
} from "lucide-react"
import type { UserProfile, ProjectRole } from "@/types/database"

interface SidebarProps {
  projectId: string
  projectName: string
  userRole: UserProfile["role"]
  projectRole?: ProjectRole
}

export function Sidebar({ projectId, projectName, userRole, projectRole }: SidebarProps) {
  const pathname = usePathname()
  const basePath = `/projects/${projectId}`

  const navItems = [
    {
      href: basePath,
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `${basePath}/rfi`,
      label: "RFI Register",
      icon: FileQuestion,
    },
    {
      href: `${basePath}/rams`,
      label: "RAMS",
      icon: FileCheck,
    },
    {
      href: `${basePath}/diary`,
      label: "Daily Diary",
      icon: BookOpen,
    },
    {
      href: `${basePath}/attendance`,
      label: "Attendance",
      icon: Users,
    },
    {
      href: `${basePath}/progress`,
      label: "Progress",
      icon: TrendingUp,
    },
    {
      href: `${basePath}/blockers`,
      label: "Blockers",
      icon: AlertTriangle,
    },
    {
      href: `${basePath}/drawings`,
      label: "Drawings",
      icon: FileImage,
    },
    {
      href: `${basePath}/reports`,
      label: "Reports",
      icon: FileText,
    },
  ]

  // Add settings for PM and Admin
  const canAccessSettings =
    userRole === "admin" ||
    userRole === "super_admin" ||
    projectRole === "pm"

  if (canAccessSettings) {
    navItems.push({
      href: `${basePath}/settings`,
      label: "Settings",
      icon: Settings,
    })
    navItems.push({
      href: `${basePath}/client-portal`,
      label: "Client Portal",
      icon: ExternalLink,
    })
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Project
        </h2>
        <p className="font-medium text-lg truncate" title={projectName}>
          {projectName}
        </p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
