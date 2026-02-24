"use client";

import { Panel } from "primereact/panel";
import { Icon } from "@/components/icons";

export interface DpContentInfoProps {
  /** Título del panel (ej. "Usuario", "Módulo") */
  title: string;
  /** Texto del botón atrás (ej. "Volver a Roles") */
  backLabel: string;
  /** Callback al hacer clic en atrás */
  onBack: () => void;
  /** Texto del botón editar (ej. "Editar Rol"). Si no se pasa, no se muestra el botón. */
  editLabel?: string;
  /** Callback al hacer clic en editar */
  onEdit?: () => void;
  children: React.ReactNode;
}

const btnClass =
  "flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

export default function DpContentInfo({
  title,
  backLabel,
  onBack,
  editLabel,
  onEdit,
  children,
}: DpContentInfoProps) {
  return (
    <Panel header={title}>
      <div className="space-y-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={onBack} className={btnClass}>
            <Icon name="chevronLeft" className="h-4 w-4" />
            {backLabel}
          </button>
          {editLabel != null && onEdit != null && (
            <button type="button" onClick={onEdit} className={btnClass}>
              {editLabel}
            </button>
          )}
        </div>
        {children}
      </div>
    </Panel>
  );
}
