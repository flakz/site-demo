"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left"
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const TooltipTrigger = ({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { ...props })
  }
  return <button type="button" {...props}>{children}</button>
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(({ className, side = "top", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-neutral-900 dark:bg-white px-3 py-1.5 text-xs text-white dark:text-neutral-900",
      className
    )}
    data-side={side}
    {...props}
  >
    {props.children}
  </div>
))
TooltipContent.displayName = "TooltipContent"
