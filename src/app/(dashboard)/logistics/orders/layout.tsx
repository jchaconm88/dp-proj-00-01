"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import OrdersScreen from "./OrdersScreen";
import SetOrderDialog from "./SetOrderDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_ORDER, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/logistics/orders/add";
  const editMatch = pathname.match(/^\/logistics\/orders\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_ORDER)) {
      router.replace("/logistics/orders");
      showAlert("error", "No tiene permisos para agregar pedidos.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_ORDER)) {
      router.replace("/logistics/orders");
      showAlert("error", "No tiene permisos para editar pedidos.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_ORDER)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_ORDER)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      <OrdersScreen refreshTrigger={refreshTrigger} />
      <SetOrderDialog visible={showDialog} orderId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
