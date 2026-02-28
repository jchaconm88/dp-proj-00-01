"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ContractsScreen from "./ContractsScreen";
import SetContractDialog from "./SetContractDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_TRANSPORT_CONTRACT, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function TransportContractsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/transport/transport-contracts/add";
  const editMatch = pathname.match(/^\/transport\/transport-contracts\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  const isRateRulesPage = pathname.match(/^\/transport\/transport-contracts\/[^/]+\/rate-rules/);

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_TRANSPORT_CONTRACT)) {
      router.replace("/transport/transport-contracts");
      showAlert("error", "No tiene permisos para agregar contratos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_TRANSPORT_CONTRACT)) {
      router.replace("/transport/transport-contracts");
      showAlert("error", "No tiene permisos para editar contratos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    !isRateRulesPage &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_TRANSPORT_CONTRACT)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_TRANSPORT_CONTRACT)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      {!isRateRulesPage && <ContractsScreen refreshTrigger={refreshTrigger} />}
      <SetContractDialog visible={showDialog} contractId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
