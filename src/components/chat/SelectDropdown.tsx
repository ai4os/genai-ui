"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectDropdownProps = {
  trigger: ReactNode;
  children: ReactNode;

  disabled?: boolean;

  className?: string;
  triggerClassName?: string;
  contentClassName?: string;

  width?: string;
};

export function SelectDropdown({
  trigger,
  children,
  disabled,
  className,
  triggerClassName,
  contentClassName,
  width = "w-72",
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-w-[220px] items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm",
          "hover:border-primary-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <div className="flex-1 overflow-hidden">
          {trigger}
        </div>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+8px)] z-20",
            width,
            "max-h-80 overflow-y-auto rounded-md border bg-popover p-2 shadow-2",
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}