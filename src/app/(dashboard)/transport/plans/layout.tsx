"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PlansScreen from "./PlansScreen";
import SetPlanDialog from "./SetPlanDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_PLAN, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/plans/add";
  const editMatch = pathname.match(/^\/transport\/plans\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_PLAN)) {
      router.replace("/transport/plans");
      showAlert("error", "No tiene permisos para agregar planes.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_PLAN)) {
      router.replace("/transport/plans");
      showAlert("error", "No tiene permisos para editar planes.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_PLAN)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_PLAN)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      <PlansScreen refreshTrigger={refreshTrigger} />
      <SetPlanDialog visible={showDialog} planId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
