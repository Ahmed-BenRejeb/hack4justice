import { cn } from "cn"

// Local edit: static, no pulse. Looping animation is forbidden (docs/design.md section 5).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
