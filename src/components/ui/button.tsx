import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "frosted-button inline-flex h-10 items-center justify-center gap-2 rounded-full border border-transparent px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary/85 text-primary-foreground hover:bg-primary/95",
        secondary: "bg-secondary/65 text-secondary-foreground hover:bg-secondary/90",
        outline: "border-border bg-surface/55 text-foreground hover:bg-secondary/80",
        ghost: "frosted-ghost text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { Button, buttonVariants };