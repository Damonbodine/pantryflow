import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  InStock: "bg-status-instock/10 text-status-instock border-status-instock/30",
  Low: "bg-status-low/10 text-status-low border-status-low/30",
  Critical: "bg-status-critical/10 text-status-critical border-status-critical/30",
  Expired: "bg-status-expired/10 text-status-expired border-status-expired/30",
  WrittenOff: "bg-status-writtenoff/10 text-status-writtenoff border-status-writtenoff/30",
  Eligible: "bg-status-instock/10 text-status-instock border-status-instock/30",
  Pending: "bg-status-low/10 text-status-low border-status-low/30",
  Ineligible: "bg-status-critical/10 text-status-critical border-status-critical/30",
  Active: "bg-status-instock/10 text-status-instock border-status-instock/30",
  Scheduled: "bg-primary/10 text-primary border-primary/30",
  Completed: "bg-muted text-muted-foreground border-muted",
  Cancelled: "bg-status-critical/10 text-status-critical border-status-critical/30",
  Received: "bg-primary/10 text-primary border-primary/30",
  Processing: "bg-status-low/10 text-status-low border-status-low/30",
  Shelved: "bg-status-instock/10 text-status-instock border-status-instock/30",
  Rejected: "bg-status-critical/10 text-status-critical border-status-critical/30",
  CheckedIn: "bg-primary/10 text-primary border-primary/30",
  InProgress: "bg-status-low/10 text-status-low border-status-low/30",
  Fulfilled: "bg-status-instock/10 text-status-instock border-status-instock/30",
  NoShow: "bg-muted text-muted-foreground border-muted",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status] ?? "bg-muted text-muted-foreground", className)}
    >
      {status}
    </Badge>
  );
}
