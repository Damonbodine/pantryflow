"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  Gift,
  Truck,
  Users,
  Heart,
  MapPin,
  AlertTriangle,
  BarChart3,
  Leaf,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Expiring Items", href: "/inventory/expiring", icon: AlertTriangle },
  { label: "Donations", href: "/donations", icon: Gift },
  { label: "Distributions", href: "/distributions", icon: Truck },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Donors", href: "/donors", icon: Heart },
  { label: "Locations", href: "/locations", icon: MapPin },
];

const analyticsNav = [
  { label: "Inventory Analytics", href: "/dashboard/inventory", icon: BarChart3 },
  { label: "Waste Reduction", href: "/dashboard/waste", icon: Leaf },
  { label: "Impact", href: "/dashboard/impact", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">PantryFlow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} className="min-h-touch" />}
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarMenu>
            {analyticsNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} className="min-h-touch" />}
                  isActive={pathname === item.href}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
