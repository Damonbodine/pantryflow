"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserButton } from "@clerk/nextjs";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  donations: "Donations",
  distributions: "Distributions",
  clients: "Clients",
  donors: "Donors",
  locations: "Locations",
  expiring: "Expiring Items",
  waste: "Waste Reduction",
  impact: "Impact Analytics",
  new: "New",
  edit: "Edit",
  transfer: "Transfer",
  "check-in": "Check In",
  fulfill: "Fulfill",
  notifications: "Notifications",
};

export function AppHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const label = routeLabels[segment] || segment;
            const isLast = index === segments.length - 1;
            return (
              <span key={href} className="flex items-center gap-1.5">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserButton />
      </div>
    </header>
  );
}
