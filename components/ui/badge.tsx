"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" }

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
      variant === "secondary" ? "border-transparent bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200" : "border-transparent bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"
