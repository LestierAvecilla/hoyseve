"use client"

import * as React from "react"
import { Tooltip } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  ...props
}: Tooltip.Provider.Props) {
  return <Tooltip.Provider data-slot="tooltip-provider" {...props} />
}

function TooltipRoot({
  ...props
}: Tooltip.Root.Props) {
  return <Tooltip.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  className,
  ...props
}: Tooltip.Trigger.Props) {
  return (
    <Tooltip.Trigger
      data-slot="tooltip-trigger"
      className={cn("cursor-default", className)}
      {...props}
    />
  )
}

function TooltipPortal({
  ...props
}: Tooltip.Portal.Props) {
  return <Tooltip.Portal data-slot="tooltip-portal" {...props} />
}

function TooltipPositioner({
  className,
  sideOffset = 4,
  ...props
}: Tooltip.Positioner.Props) {
  return (
    <TooltipPortal>
      <Tooltip.Positioner
        data-slot="tooltip-positioner"
        sideOffset={sideOffset}
        className={cn("z-50", className)}
        {...props}
      />
    </TooltipPortal>
  )
}

function TooltipPopup({
  className,
  ...props
}: Tooltip.Popup.Props) {
  return (
    <Tooltip.Popup
      data-slot="tooltip-popup"
      className={cn(
        "origin-[var(--transform-origin)] rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-xs font-medium uppercase tracking-wider shadow-md outline-none",
        "transition-[transform,scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

export {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPositioner,
  TooltipPopup,
}
