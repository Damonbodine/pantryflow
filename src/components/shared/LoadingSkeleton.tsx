import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingSkeleton({ variant = "table" }: { variant?: "table" | "dashboard" | "detail" | "form" | "list" }) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // table variant (default)
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-lg border border-border">
        <div className="p-4">
          <Skeleton className="h-4 w-full mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
