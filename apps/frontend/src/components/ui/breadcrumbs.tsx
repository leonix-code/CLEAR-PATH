"use client";

import { Fragment } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      <ol className="flex items-center gap-1">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="text-foreground-muted hover:text-foreground transition-colors p-1"
              aria-label="Home"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </li>
        )}
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {(showHome || index > 0) && (
              <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
            )}
            <li>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    "text-foreground-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
                    index === items.length - 1 && "text-foreground font-medium"
                  )}
                  aria-current={index === items.length - 1 ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="px-2 py-1 text-foreground font-medium cursor-default"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
