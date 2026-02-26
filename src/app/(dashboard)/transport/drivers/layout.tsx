"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DriversScreen from "./DriversScreen";
import SetDriverDialog from "./SetDriverDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_DRIVER, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function DriversLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/drivers/add";
  const editMatch = pathname.match(/^\/transport\/drivers\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_DRIVER)) {
      router.replace("/transport/drivers");
      showAlert("error", "No tiene permisos para agregar conductores.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_DRIVER)) {
      router.replace("/transport/drivers");
      showAlert("error", "No tiene permisos para editar conductores.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_DRIVER)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_DRIVER)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      <DriversScreen refreshTrigger={refreshTrigger} />
      <SetDriverDialog visible={showDialog} driverId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
