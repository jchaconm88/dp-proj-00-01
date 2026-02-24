"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import { isGranted as isGrantedAccess } from "@/services/accessService";

const NO_PERMISSION_MESSAGE = "No tiene permisos para realizar esta acción.";

export function useAccessService() {
  const { user } = useUser();
  const isGranted = useCallback(
    (permission: string, module: string) => isGrantedAccess(user, permission, module),
    [user]
  );
  const requirePermissionOrAlert = useCallback(
    (permission: string, module: string): boolean => {
      if (isGrantedAccess(user, permission, module)) return true;
      if (typeof window !== "undefined") window.alert(NO_PERMISSION_MESSAGE);
      return false;
    },
    [user]
  );
  return useMemo(
    () => ({ isGranted, requirePermissionOrAlert }),
    [isGranted, requirePermissionOrAlert]
  );
}

