"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import ModulesScreen from "./ModulesScreen";
import SetModuleDialog from "./SetModuleDialog";

export default function SystemModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isInfoPage = pathname.startsWith("/system/modules/info");
  const showAdd = pathname === "/system/modules/add";
  const editMatch = pathname.match(/^\/system\/modules\/edit\/([^/]+)$/);
  const editModuleId = editMatch ? editMatch[1] : null;
  const showDialog = showAdd || !!editModuleId;

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  if (isInfoPage) {
    return <>{children}</>;
  }

  return (
    <>
      <ModulesScreen refreshTrigger={refreshTrigger} />
      <SetModuleDialog
        visible={showDialog}
        moduleId={editModuleId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
