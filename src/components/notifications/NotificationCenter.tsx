"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Check, CheckCheck, AlertTriangle, Info, AlertCircle } from "lucide-react";

export function NotificationCenter() {
  const notifications = useQuery(api.notifications.listByUser, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!notifications) return <LoadingSkeleton variant="list" />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const severityIcon = (severity?: string) => {
    switch (severity) {
      case "Critical": return <AlertCircle className="h-4 w-4 text-status-critical" />;
      case "Warning": return <AlertTriangle className="h-4 w-4 text-status-low" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead({})}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="No notifications" icon="bell" />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card key={notif._id} className={`shadow-warm ${!notif.isRead ? "border-l-4 border-l-primary" : ""}`}>
              <CardContent className="flex items-start gap-3 py-4">
                {severityIcon(notif.severity ?? undefined)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.isRead ? "font-semibold" : ""}`}>{notif.title}</p>
                    <Badge variant="outline" className="text-xs">{notif.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notif.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={notif.link}>View</Link>
                    </Button>
                  )}
                  {!notif.isRead && (
                    <Button variant="ghost" size="icon" onClick={() => markAsRead({ id: notif._id })}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
