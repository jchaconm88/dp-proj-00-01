"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useAccessService } from "@/hooks/useAccessService";
import { getRequiredPermissionForPath } from "@/data/routePermissions";

const NOT_FOUND_PATH = "/not-found";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: userLoading } = useUser();
  const { isGranted } = useAccessService();

  const { canShowContent, shouldRedirect } = useMemo(() => {
    if (userLoading) {
      return { canShowContent: false, shouldRedirect: false };
    }
    if (!pathname || pathname.startsWith(NOT_FOUND_PATH)) {
      return { canShowContent: true, shouldRedirect: false };
    }
    const required = getRequiredPermissionForPath(pathname);
    if (!required) {
      return { canShowContent: true, shouldRedirect: false };
    }
    const granted = isGranted(required.permission, required.module);
    return {
      canShowContent: granted,
      shouldRedirect: !granted,
    };
  }, [userLoading, pathname, isGranted]);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`${NOT_FOUND_PATH}?reason=forbidden`);
    }
  }, [shouldRedirect, router]);

  if (userLoading || shouldRedirect) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {userLoading ? "Cargando…" : "Verificando acceso…"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
