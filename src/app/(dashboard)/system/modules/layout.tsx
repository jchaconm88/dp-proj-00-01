"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ModulesScreen from "./ModulesScreen";
import SetModuleDialog from "./SetModuleDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_MODULE, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function SystemModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isInfoPage = pathname.startsWith("/system/modules/info");
  const showAdd = pathname === "/system/modules/add";
  const editMatch = pathname.match(/^\/system\/modules\/edit\/([^/]+)$/);
  const editModuleId = editMatch ? editMatch[1] : null;
  const showEditDialog = !!editModuleId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_MODULE)) {
      router.replace("/system/modules");
      showAlert("error", "No tiene permisos para agregar módulos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_MODULE)) {
      router.replace("/system/modules");
      showAlert("error", "No tiene permisos para editar módulos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_MODULE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_MODULE)));

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
