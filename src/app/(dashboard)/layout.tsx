import DashboardShell, { type MenuData } from "@/components/DashboardShell";
import menuData from "@/data/menu.json";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell menu={menuData as MenuData}>
      {children}
    </DashboardShell>
  );
}
