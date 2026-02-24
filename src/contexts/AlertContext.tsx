"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type AlertType = "error" | "warning" | "info" | "success";

export interface AlertState {
  message: string;
  type: AlertType;
  visible: boolean;
}

export interface AlertContextValue {
  alert: AlertState;
  showAlert: (type: AlertType, message: string) => void;
  clearAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

const initialState: AlertState = {
  message: "",
  type: "info",
  visible: false,
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState>(initialState);

  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ message, type, visible: true });
  }, []);

  const clearAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const value: AlertContextValue = {
    alert,
    showAlert,
    clearAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert debe usarse dentro de <AlertProvider>.");
  return ctx;
}
