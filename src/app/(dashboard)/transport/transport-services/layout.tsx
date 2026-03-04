"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import TransportServicesScreen from "./TransportServicesScreen";
import SetServiceTypeDialog from "./SetServiceTypeDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_TRANSPORT_SERVICE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function TransportServicesLayout({
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

  const showAdd = pathname === "/transport/transport-services/add";
  const editMatch = pathname.match(/^\/transport\/transport-services\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_TRANSPORT_SERVICE)) {
      router.replace("/transport/transport-services");
      showAlert("error", "No tiene permisos para agregar servicios de transporte.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_TRANSPORT_SERVICE)) {
      router.replace("/transport/transport-services");
      showAlert("error", "No tiene permisos para editar servicios de transporte.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_TRANSPORT_SERVICE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_TRANSPORT_SERVICE)));

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  return (
    <>
      <TransportServicesScreen refreshTrigger={refreshTrigger} />
      <SetServiceTypeDialog
        visible={showDialog}
        serviceTypeId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
