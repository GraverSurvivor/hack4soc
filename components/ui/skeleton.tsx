import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-soft rounded-xl bg-navy-700/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
