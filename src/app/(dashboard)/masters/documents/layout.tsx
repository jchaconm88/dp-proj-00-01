"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DocumentsScreen from "./DocumentsScreen";
import SetDocumentDialog from "./SetDocumentDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_DOCUMENT,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function DocumentsLayout({
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

  const showAdd = pathname === "/masters/documents/add";
  const editMatch = pathname.match(/^\/masters\/documents\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_DOCUMENT)) {
      router.replace("/masters/documents");
      showAlert("error", "No tiene permisos para agregar documentos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_DOCUMENT)) {
      router.replace("/masters/documents");
      showAlert("error", "No tiene permisos para editar documentos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_DOCUMENT)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_DOCUMENT)));

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  return (
    <>
      <DocumentsScreen refreshTrigger={refreshTrigger} />
      <SetDocumentDialog
        visible={showDialog}
        documentId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
