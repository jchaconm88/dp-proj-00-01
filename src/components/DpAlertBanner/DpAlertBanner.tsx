"use client";

import { useAlert } from "@/contexts/AlertContext";
import type { AlertType } from "@/contexts/AlertContext";

const TYPE_STYLES: Record<
  AlertType,
  { border: string; bg: string; text: string }
> = {
  error: {
    border: "border-t-red-500",
    bg: "bg-zinc-50 dark:bg-zinc-800/80",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  warning: {
    border: "border-t-amber-500",
    bg: "bg-amber-50/80 dark:bg-amber-900/20",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  info: {
    border: "border-t-blue-500",
    bg: "bg-blue-50/80 dark:bg-blue-900/20",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  success: {
    border: "border-t-emerald-500",
    bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
    text: "text-zinc-800 dark:text-zinc-200",
  },
};

export default function DpAlertBanner() {
  const { alert, clearAlert } = useAlert();

  if (!alert.visible || !alert.message) return null;

  const style = TYPE_STYLES[alert.type];

  return (
    <div
      role="alert"
      className={`mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 border-t-4 px-4 py-3 shadow-sm dark:border-zinc-700 ${style.border} ${style.bg}`}
    >
      <p className={`flex-1 text-sm ${style.text}`}>{alert.message}</p>
      <button
        type="button"
        onClick={clearAlert}
        className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
        aria-label="Cerrar"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
}
