"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ResourcesScreen from "./ResourcesScreen";
import SetResourceDialog from "./SetResourceDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import {
  MODULE_RESOURCE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
} from "@/constants/permissions";

export default function ResourcesLayout({
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

  const showAdd = pathname === "/human-resources/resources/add";
  const editMatch = pathname.match(/^\/human-resources\/resources\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_RESOURCE)) {
      router.replace("/human-resources/resources");
      showAlert("error", "No tiene permisos para agregar recursos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_RESOURCE)) {
      router.replace("/human-resources/resources");
      showAlert("error", "No tiene permisos para editar recursos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_RESOURCE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_RESOURCE)));

  const isResourceCostsPage = pathname.match(/^\/human-resources\/resources\/[^/]+\/resource-costs/);
  const showList = !isResourceCostsPage;

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
  };

  return (
    <>
      {showList && <ResourcesScreen refreshTrigger={refreshTrigger} />}
      <SetResourceDialog
        visible={showDialog}
        resourceId={editId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
