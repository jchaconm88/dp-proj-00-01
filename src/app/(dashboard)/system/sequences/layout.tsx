"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import SequencesScreen from "./SequencesScreen";
import SetSequenceDialog from "./SetSequenceDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_SEQUENCE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function SequencesLayout({
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

  const showAdd = pathname === "/system/sequences/add";
  const editMatch = pathname.match(/^\/system\/sequences\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_SEQUENCE)) {
      router.replace("/system/sequences");
      showAlert("error", "No tiene permisos para agregar secuencias.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_SEQUENCE)) {
      router.replace("/system/sequences");
      showAlert("error", "No tiene permisos para editar secuencias.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_SEQUENCE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_SEQUENCE)));

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
  };

  return (
    <>
      <SequencesScreen refreshTrigger={refreshTrigger} />
      <SetSequenceDialog
        visible={showDialog}
        sequenceId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
