import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-navy-600 bg-navy-800 px-4 py-2 text-sm text-white placeholder:text-navy-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet transition-all",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
