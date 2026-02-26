"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ClientsScreen from "./ClientsScreen";
import SetClientDialog from "./SetClientDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_CLIENT, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/masters/clients/add";
  const editMatch = pathname.match(/^\/masters\/clients\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_CLIENT)) {
      router.replace("/masters/clients");
      showAlert("error", "No tiene permisos para agregar clientes.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_CLIENT)) {
      router.replace("/masters/clients");
      showAlert("error", "No tiene permisos para editar clientes.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_CLIENT)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_CLIENT)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  const isLocationsPage = pathname.match(/^\/masters\/clients\/[^/]+\/locations$/);
  const showList = !isLocationsPage;

  return (
    <>
      {showList && <ClientsScreen refreshTrigger={refreshTrigger} />}
      <SetClientDialog visible={showDialog} clientId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
