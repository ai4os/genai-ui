import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-disabled-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-700",
        secondary:
          "border-control bg-background text-foreground hover:bg-soft aria-expanded:bg-muted",
        ghost:
          "bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted disabled:bg-transparent",
        destructive:
          "border-error-border bg-background text-destructive hover:bg-error-surface",
        destructiveSolid:
          "bg-destructive text-white hover:bg-danger-hover",
        chip: "border-input bg-background text-foreground hover:bg-soft",
        inverse:
          "bg-white font-semibold text-primary hover:bg-primary-50 focus-visible:outline-white",
      },
      size: {
        default: "h-10 px-[18px] text-sm",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
