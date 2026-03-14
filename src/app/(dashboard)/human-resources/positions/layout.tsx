"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PositionsScreen from "./PositionsScreen";
import SetPositionDialog from "./SetPositionDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_POSITION,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function PositionsLayout({
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

  const showAdd = pathname === "/human-resources/positions/add";
  const editMatch = pathname.match(/^\/human-resources\/positions\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_POSITION)) {
      router.replace("/human-resources/positions");
      showAlert("error", "No tiene permisos para agregar cargos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_POSITION)) {
      router.replace("/human-resources/positions");
      showAlert("error", "No tiene permisos para editar cargos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_POSITION)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_POSITION)));

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
  };

  return (
    <>
      <PositionsScreen refreshTrigger={refreshTrigger} />
      <SetPositionDialog
        visible={showDialog}
        positionId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
