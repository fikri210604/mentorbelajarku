"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { MANAGEMENT_NAV, TUTOR_NAV } from "@/config/navigation";

interface Crumb {
  label: string;
  href?: string;
}

const NAV_ITEMS = [...MANAGEMENT_NAV, ...TUTOR_NAV].flatMap(
  (section) => section.items
);

function titleCase(segment: string): string {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === "/dashboard" || pathname === "/") return [];

  const crumbLists: Crumb[] = [
    { label: "Beranda", href: pathname.startsWith("/tutor") ? "/tutor/dashboard" : "/management/dashboard" },
  ];

  const exact = NAV_ITEMS.find(
    (item) => item.href === pathname || pathname.startsWith(item.href + "/")
  );

  if (exact && exact.href === pathname) {
    crumbLists.push({ label: exact.title });
    return crumbLists;
  }

  const segments = pathname.split("/").filter(Boolean);
  let current = "";
  for (let i = 0; i < segments.length; i++) {
    current += "/" + segments[i];
    const matched = NAV_ITEMS.find((item) => item.href === current);
    const isLast = i === segments.length - 1;

    if (matched) {
      if (crumbLists[crumbLists.length - 1].href === matched.href) continue;
      crumbLists.push(
        isLast
          ? { label: matched.title }
          : { label: matched.title, href: matched.href }
      );
    } else if (!["management", "tutor", "settings", "new", "edit"].includes(segments[i])) {
      crumbLists.push(
        isLast
          ? { label: titleCase(segments[i]) }
          : { label: titleCase(segments[i]), href: current }
      );
    }
  }

  return crumbLists;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className="flex items-center gap-1.5 min-w-0"
    >
      <Link
        href={crumbs[0].href ?? "/management/dashboard"}
        aria-label={crumbs[0].label}
        className="flex items-center shrink-0"
      >
        <Home className="size-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => {
        const href = crumb.href;
        return (
          <React.Fragment key={`${href ?? crumb.label}-${i}`}>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" data-slot="breadcrumb-separator" />
            {href ? (
              <Link
                href={href}
                className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap cursor-pointer transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                data-slot="breadcrumb-page"
                aria-current="page"
                className="text-xs font-semibold text-foreground line-clamp-1"
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default BreadcrumbNav;
