"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DocumentTypesScreen from "./DocumentTypesScreen";
import SetDocumentTypeDialog from "./SetDocumentTypeDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_DOCUMENT_TYPE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function DocumentTypesLayout({
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

  const showAdd = pathname === "/masters/document-types/add";
  const editMatch = pathname.match(/^\/masters\/document-types\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_DOCUMENT_TYPE)) {
      router.replace("/masters/document-types");
      showAlert("error", "No tiene permisos para agregar tipos de documento.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_DOCUMENT_TYPE)) {
      router.replace("/masters/document-types");
      showAlert("error", "No tiene permisos para editar tipos de documento.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_DOCUMENT_TYPE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_DOCUMENT_TYPE)));

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  return (
    <>
      <DocumentTypesScreen refreshTrigger={refreshTrigger} />
      <SetDocumentTypeDialog
        visible={showDialog}
        documentTypeId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
