"use client";

import { forwardRef, useState } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
  status?: "online" | "offline" | "away";
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const statusSizeMap = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

const statusColorMap = {
  online: "bg-emerald-500",
  offline: "bg-neutral-400",
  away: "bg-amber-500",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = "", firstName = "", lastName = "", size = "md", className, fallbackClassName, status }, ref) => {
    const [imgError, setImgError] = useState(false);
    const initials = getInitials(firstName, lastName);

    return (
      <div ref={ref} className="relative inline-flex">
        <div
          className={cn(
            "relative rounded-full overflow-hidden flex-shrink-0",
            "bg-gradient-to-br from-brand-400 to-brand-600",
            sizeMap[size],
            className
          )}
        >
          {src && !imgError ? (
            <img
              src={src}
              alt={alt || `${firstName} ${lastName}`}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={cn(
                "h-full w-full flex items-center justify-center text-white font-semibold",
                fallbackClassName
              )}
              aria-label={alt || `${firstName} ${lastName}`}
            >
              {initials || "?"}
            </div>
          )}
        </div>
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-neutral-900",
              statusSizeMap[size],
              statusColorMap[status]
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
