"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "Admin" | "PantryManager" | "VolunteerLead" | "Volunteer" | "ClientServices";

const ROLE_DEFAULT_ROUTES: Record<Role, string> = {
  Admin: "/dashboard",
  PantryManager: "/dashboard",
  VolunteerLead: "/distributions",
  Volunteer: "/distributions",
  ClientServices: "/clients",
};

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(
    api.users.getByClerkId,
    userId ? { clerkId: userId } : "skip"
  );

  useEffect(() => {
    if (currentUser && !allowedRoles.includes(currentUser.role as Role)) {
      const defaultRoute = ROLE_DEFAULT_ROUTES[currentUser.role as Role] || "/dashboard";
      router.replace(defaultRoute);
    }
  }, [currentUser, allowedRoles, router]);

  if (!currentUser) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!allowedRoles.includes(currentUser.role as Role)) {
    return null;
  }

  return <>{children}</>;
}
