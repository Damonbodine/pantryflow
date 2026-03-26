"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/notifications">
        <Bell className="h-5 w-5" />
        {unreadCount != null && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
