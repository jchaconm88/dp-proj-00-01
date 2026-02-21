"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import UsersScreen from "./UsersScreen";
import AddUserDialog from "./AddUserDialog";
import EditUserDialog from "./EditUserDialog";

export default function SystemUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAdd = pathname === "/system/users/add";
  const editMatch = pathname.match(/^\/system\/users\/edit\/([^/]+)$/);
  const editUserId = editMatch ? editMatch[1] : null;

  const onDialogSuccess = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  return (
    <>
      <UsersScreen refreshTrigger={refreshTrigger} />
      <AddUserDialog visible={showAdd} onSuccess={onDialogSuccess} />
      <EditUserDialog
        visible={!!editUserId}
        userId={editUserId}
        onSuccess={onDialogSuccess}
      />
      {children}
    </>
  );
}
