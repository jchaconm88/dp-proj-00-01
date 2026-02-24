"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import UsersScreen from "./UsersScreen";
import SetUserDialog from "./SetUserDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_USER, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function SystemUsersLayout({
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

  const showAdd = pathname === "/system/users/add";
  const editMatch = pathname.match(/^\/system\/users\/edit\/([^/]+)$/);
  const editUserId = editMatch ? editMatch[1] : null;
  const showEditDialog = !!editUserId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_USER)) {
      router.replace("/system/users");
      showAlert("error", "No tiene permisos para agregar usuarios.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_USER)) {
      router.replace("/system/users");
      showAlert("error", "No tiene permisos para editar usuarios.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_USER)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_USER)));

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  return (
    <>
      <UsersScreen refreshTrigger={refreshTrigger} />
      <SetUserDialog
        visible={showDialog}
        userId={editUserId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
