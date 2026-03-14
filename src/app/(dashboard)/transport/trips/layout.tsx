"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import TripsScreen from "./TripsScreen";
import SetTripDialog from "./SetTripDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_TRIP, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/trips/add";
  const editMatch = pathname.match(/^\/transport\/trips\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_TRIP)) {
      router.replace("/transport/trips");
      showAlert("error", "No tiene permisos para agregar viajes.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_TRIP)) {
      router.replace("/transport/trips");
      showAlert("error", "No tiene permisos para editar viajes.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_TRIP)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_TRIP)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  const isTripStopsPage = pathname.match(/^\/transport\/trips\/[^/]+\/trip-stops$/);
  const isEvidencePage = pathname.match(/^\/transport\/trips\/[^/]+\/trip-stops\/[^/]+\/evidence$/);
  const isTripAssignmentsPage = pathname.match(/^\/transport\/trips\/[^/]+\/trip-assignments/);
  const isTripChargesPage = pathname.match(/^\/transport\/trips\/[^/]+\/trip-charges/);
  const isTripCostsPage = pathname.match(/^\/transport\/trips\/[^/]+\/trip-costs/);
  const showList = !isTripStopsPage && !isEvidencePage && !isTripAssignmentsPage && !isTripChargesPage && !isTripCostsPage;

  return (
    <>
      {showList && <TripsScreen refreshTrigger={refreshTrigger} />}
      <SetTripDialog visible={showDialog} tripId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
