import DashboardShell, { type MenuData } from "@/components/DashboardShell";
import menuData from "@/data/menu.json";
import { UserProvider } from "@/contexts/UserContext";
import RouteGuard from "@/components/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardShell menu={menuData as MenuData}>
        <RouteGuard>{children}</RouteGuard>
      </DashboardShell>
    </UserProvider>
  );
}
