"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (userLoading) return;
    if (!pathname || pathname.startsWith(NOT_FOUND_PATH)) return;

    const required = getRequiredPermissionForPath(pathname);
    if (!required) return;

    if (!isGranted(required.permission, required.module)) {
      router.replace(`${NOT_FOUND_PATH}?reason=forbidden`);
    }
  }, [userLoading, pathname, isGranted, router]);

  return <>{children}</>;
}
