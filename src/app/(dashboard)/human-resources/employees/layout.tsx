"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import EmployeesScreen from "./EmployeesScreen";
import SetEmployeeDialog from "./SetEmployeeDialog";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { useAlert } from "@/contexts/AlertContext";
import { MODULE_EMPLOYEE, PERMISSION_CREATE, PERMISSION_UPDATE } from "@/constants/permissions";

export default function EmployeesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();
  const { showAlert } = useAlert();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/human-resources/employees/add";
  const editMatch = pathname.match(/^\/human-resources\/employees\/edit\/([^/]+)$/);
  const editId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const showEditDialog = !!editId;
  const showAddDialog = showAdd;

  useEffect(() => {
    if (userLoading) return;
    if (showAddDialog && !isGranted(PERMISSION_CREATE, MODULE_EMPLOYEE)) {
      router.replace("/human-resources/employees");
      showAlert("error", "No tiene permisos para agregar empleados.");
    }
  }, [userLoading, showAddDialog, isGranted, router, showAlert]);

  useEffect(() => {
    if (userLoading) return;
    if (showEditDialog && !isGranted(PERMISSION_UPDATE, MODULE_EMPLOYEE)) {
      router.replace("/human-resources/employees");
      showAlert("error", "No tiene permisos para editar empleados.");
    }
  }, [userLoading, showEditDialog, isGranted, router, showAlert]);

  const showDialog =
    !userLoading &&
    ((showAddDialog && isGranted(PERMISSION_CREATE, MODULE_EMPLOYEE)) ||
      (showEditDialog && isGranted(PERMISSION_UPDATE, MODULE_EMPLOYEE)));

  const onDialogSuccess = useCallback(() => setRefreshTrigger((k) => k + 1), []);

  return (
    <>
      <EmployeesScreen refreshTrigger={refreshTrigger} />
      <SetEmployeeDialog visible={showDialog} employeeId={editId} onSuccess={onDialogSuccess} />
      {children}
    </>
  );
}
