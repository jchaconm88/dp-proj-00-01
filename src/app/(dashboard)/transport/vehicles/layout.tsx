"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import VehiclesScreen from "./VehiclesScreen";
import SetVehicleDialog from "./SetVehicleDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_VEHICLE, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/vehicles/add";
  const editMatch = pathname.match(/^\/transport\/vehicles\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_VEHICLE)) {
      router.replace("/transport/vehicles");
      showAlert("error", "No tiene permisos para agregar vehículos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_VEHICLE)) {
      router.replace("/transport/vehicles");
      showAlert("error", "No tiene permisos para editar vehículos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_VEHICLE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_VEHICLE)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      <VehiclesScreen refreshTrigger={refreshTrigger} />
      <SetVehicleDialog visible={showDialog} vehicleId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
