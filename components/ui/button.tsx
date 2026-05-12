"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost"
  size?: "default" | "icon" | "sm"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
      variant === "default" ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100" : "",
      variant === "secondary" ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-700" : "",
      variant === "ghost" ? "hover:bg-neutral-200 dark:hover:bg-neutral-800" : "",
      size === "default" ? "h-10 px-4 py-2" : "",
      size === "sm" ? "h-9 px-3" : "",
      size === "icon" ? "h-10 w-10" : "",
      className
    )}
    {...props}
  />
))
Button.displayName = "Button"
