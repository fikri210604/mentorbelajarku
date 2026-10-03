import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-[0.625rem] font-semibold tracking-widest whitespace-nowrap uppercase transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "text-foreground [a]:hover:text-foreground/70",
        secondary: "text-muted-foreground [a]:hover:text-foreground",
        destructive:
          "rounded-md border border-destructive/30 bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-semibold normal-case tracking-normal focus-visible:ring-destructive/20",
        outline: "text-foreground [a]:hover:text-foreground/70",
        ghost: "text-muted-foreground hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        success:
          "rounded-md border border-success/30 bg-success/15 text-success px-2 py-0.5 text-xs font-semibold normal-case tracking-normal",
        warning:
          "rounded-md border border-warning/30 bg-warning/15 text-warning px-2 py-0.5 text-xs font-semibold normal-case tracking-normal",
        danger:
          "rounded-md border border-danger/30 bg-danger/15 text-danger px-2 py-0.5 text-xs font-semibold normal-case tracking-normal",
        info:
          "rounded-md border border-info/30 bg-info/15 text-info px-2 py-0.5 text-xs font-semibold normal-case tracking-normal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
