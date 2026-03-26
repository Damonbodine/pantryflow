import { Package, Gift, Truck, Users, Heart, MapPin, Bell, Calendar, CheckCircle } from "lucide-react";

const icons: Record<string, React.ElementType> = {
  package: Package,
  gift: Gift,
  truck: Truck,
  users: Users,
  heart: Heart,
  mapPin: MapPin,
  bell: Bell,
  calendar: Calendar,
  check: CheckCircle,
};

export function EmptyState({
  message,
  icon = "package",
  action,
}: {
  message: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  const IconComponent = icons[icon] ?? Package;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}
