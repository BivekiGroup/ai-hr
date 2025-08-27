import * as React from "react"
import { cn } from "@/lib/utils"

export function Progress({ value = 0, className, ...props }: { value?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </div>
  )
}

