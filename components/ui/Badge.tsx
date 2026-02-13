import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                // Custom Protocol Categories
                fungicida: "border-transparent bg-purple-900/50 text-purple-200 border-purple-700 hover:bg-purple-900/70",
                inseticida: "border-transparent bg-red-900/50 text-red-200 border-red-700 hover:bg-red-900/70",
                herbicida: "border-transparent bg-yellow-900/50 text-yellow-200 border-yellow-700 hover:bg-yellow-900/70",
                nutricao: "border-transparent bg-green-900/50 text-green-200 border-green-700 hover:bg-green-900/70",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
