"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import RolesScreen from "./RolesScreen";
import SetRoleDialog from "./SetRoleDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_ROLE, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function SystemRolesLayout({
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

  const isInfoPage = pathname.startsWith("/system/roles/info");
  const showAdd = pathname === "/system/roles/add";
  const editMatch = pathname.match(/^\/system\/roles\/edit\/([^/]+)$/);
  const editRoleId = editMatch ? editMatch[1] : null;
  const showEditDialog = !!editRoleId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_ROLE)) {
      router.replace("/system/roles");
      showAlert("error", "No tiene permisos para agregar roles.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_ROLE)) {
      router.replace("/system/roles");
      showAlert("error", "No tiene permisos para editar roles.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_ROLE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_ROLE)));

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
