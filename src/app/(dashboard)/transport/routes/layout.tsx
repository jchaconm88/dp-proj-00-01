"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import RoutesScreen from "./RoutesScreen";
import SetRouteDialog from "./SetRouteDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_ROUTE, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/routes/add";
  const editMatch = pathname.match(/^\/transport\/routes\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_ROUTE)) {
      router.replace("/transport/routes");
      showAlert("error", "No tiene permisos para agregar rutas.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_ROUTE)) {
      router.replace("/transport/routes");
      showAlert("error", "No tiene permisos para editar rutas.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_ROUTE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_ROUTE)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  const isStopsPage = pathname.match(/^\/transport\/routes\/[^/]+\/stops$/);
  const showList = !isStopsPage;

  return (
    <>
      {showList && <RoutesScreen refreshTrigger={refreshTrigger} />}
      <SetRouteDialog visible={showDialog} routeId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
