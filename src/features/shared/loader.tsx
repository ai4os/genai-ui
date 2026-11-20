import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


export function PageLoader({
  className,
}: Readonly<{
  label?: string;
  className?: string;
}>) {
  return (
    <div
      role="status"
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col animate-in fade-in duration-500",
        className,
      )}
    >
      {/* Header */}
      <header className="flex min-h-[72px] items-center gap-3 border-b border-border px-6 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <Skeleton className="hidden h-10 w-[120px] rounded-full sm:block" />
        </div>
        <Skeleton className="h-10 w-[180px] max-w-full rounded-full" />
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-8 overflow-hidden px-4 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          {/* Assistant message */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>

            <div className="flex flex-col gap-2 pl-10">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[92%]" />
              <Skeleton className="h-3 w-[75%]" />
              <Skeleton className="mt-2 h-3 w-[85%]" />
              <Skeleton className="h-3 w-[60%]" />
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="flex w-[65%] flex-col gap-2 rounded-md bg-muted p-4">
              <Skeleton className="h-3 w-full bg-background/60" />
              <Skeleton className="h-3 w-[70%] bg-background/60" />
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>

            <div className="flex flex-col gap-2 pl-10">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[95%]" />
              <Skeleton className="h-3 w-[82%]" />
              <Skeleton className="mt-2 h-3 w-[65%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="px-6 pb-6">
        <div className="mx-auto flex min-h-[60px] max-w-3xl items-center gap-3 rounded-[30px] border border-input bg-background p-[9px]">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-40 max-w-[50%]" />
          <div className="flex-1" />
          <Skeleton className="size-10 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}
