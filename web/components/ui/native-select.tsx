import * as React from "react"
import { cn } from "cn"

// Local primitive: the browser's own <select>, styled to match Input. Keyboard and screen-reader
// behaviour come from the platform, and no select primitive is installed from the registry.
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
