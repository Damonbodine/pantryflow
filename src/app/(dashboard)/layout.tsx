"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Authenticated, AuthLoading } from "convex/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DemoMode } from "@/components/demo-mode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AuthLoading>
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <LoadingSkeleton variant="dashboard" />
          </div>
        </AuthLoading>
        <Authenticated>
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 p-6 bg-background">{children}</main>
            <DemoMode />
          </div>
        </Authenticated>
      </div>
    </SidebarProvider>
  );
}
