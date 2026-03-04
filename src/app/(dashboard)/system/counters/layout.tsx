"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CountersScreen from "./CountersScreen";
import SetCounterDialog from "./SetCounterDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_COUNTER,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function CountersLayout({
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

  const showAdd = pathname === "/system/counters/add";
  const editMatch = pathname.match(/^\/system\/counters\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_COUNTER)) {
      router.replace("/system/counters");
      showAlert("error", "No tiene permisos para agregar contadores.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_COUNTER)) {
      router.replace("/system/counters");
      showAlert("error", "No tiene permisos para editar contadores.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_COUNTER)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_COUNTER)));

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
  };

  return (
    <>
      <CountersScreen refreshTrigger={refreshTrigger} />
      <SetCounterDialog
        visible={showDialog}
        counterId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
