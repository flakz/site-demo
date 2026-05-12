"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("shrink-0 bg-neutral-200 dark:bg-white/10 h-px w-full", className)} {...props} />
))
Separator.displayName = "Separator"
