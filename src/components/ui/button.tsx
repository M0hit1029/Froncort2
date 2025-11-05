import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00ff00] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#004000] text-[#00ff00] border border-[#00ff00]/50 shadow hover:bg-[#006000]",
        destructive:
          "bg-[#400000] text-[#ff0000] border border-[#ff0000]/50 shadow-sm hover:bg-[#600000]",
        outline:
          "border border-[#00ff00]/30 bg-black shadow-sm hover:bg-[#002000]",
        secondary:
          "bg-black text-[#00ff00] border border-[#00ff00]/30 shadow-sm hover:bg-[#002000]",
        ghost: "hover:bg-[#002000] text-[#00ff00]",
        link: "text-[#00ff00] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
