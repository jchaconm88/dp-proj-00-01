"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import RolesScreen from "./RolesScreen";
import SetRoleDialog from "./SetRoleDialog";

export default function SystemRolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isInfoPage = pathname.startsWith("/system/roles/info");
  const showAdd = pathname === "/system/roles/add";
  const editMatch = pathname.match(/^\/system\/roles\/edit\/([^/]+)$/);
  const editRoleId = editMatch ? editMatch[1] : null;
  const showDialog = showAdd || !!editRoleId;

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  if (isInfoPage) {
    return <>{children}</>;
  }

  return (
    <>
      <RolesScreen refreshTrigger={refreshTrigger} />
      <SetRoleDialog
        visible={showDialog}
        roleId={editRoleId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
