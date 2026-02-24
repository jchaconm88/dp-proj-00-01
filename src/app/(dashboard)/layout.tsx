import DashboardShell, { type MenuData } from "@/components/DashboardShell";
import menuData from "@/data/menu.json";
import { UserProvider } from "@/contexts/UserContext";
import { AlertProvider } from "@/contexts/AlertContext";
import RouteGuard from "@/components/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AlertProvider>
        <DashboardShell menu={menuData as MenuData}>
          <RouteGuard>{children}</RouteGuard>
        </DashboardShell>
      </AlertProvider>
    </UserProvider>
  );
}
