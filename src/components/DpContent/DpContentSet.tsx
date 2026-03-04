"use client";

import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

export interface DpContentSetProps {
  /** Título del panel o del diálogo (ej. "USUARIO", "Regla de tarifa"). En variant "inline" no se muestra. */
  title: string;
  /** Texto del botón cancelar (por defecto "Cancelar") */
  cancelLabel?: string;
  /** Callback al hacer clic en cancelar */
  onCancel: () => void;
  /** Texto del botón guardar (por defecto "Guardar") */
  saveLabel?: string;
  /** Callback al hacer clic en guardar */
  onSave: () => void;
  /** Mientras es true se muestra "Guardando…" y se deshabilitan ambos botones */
  saving?: boolean;
  /** Si true, el botón guardar está deshabilitado (ej. formulario inválido) */
  saveDisabled?: boolean;
  /**
   * "panel" = Panel con título (pantallas set a página completa).
   * "inline" = solo contenido + botones, sin Panel (cuando otro componente envuelve).
   * Si se pasa visible (boolean), se usa modo "dialog": DpContentSet envuelve todo en un Dialog.
   */
  variant?: "panel" | "inline";
  /**
   * Modo modal: cuando está definido, DpContentSet renderiza el Dialog.
   * onHide se llama al cerrar (X, Escape, máscara). Típicamente igual que onCancel.
   */
  visible?: boolean;
  /** Requerido cuando visible está definido. Cierra el modal (X, Escape, clic fuera). */
  onHide?: () => void;
  /** Contenido del formulario. Si hay loading, puede ser ReactNode (ej. mensaje "Cargando…"). */
  children: React.ReactNode;
}

const footer = (
  cancelLabel: string,
  saveLabel: string,
  onCancel: () => void,
  onSave: () => void,
  saving: boolean,
  saveDisabled: boolean
) => (
  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
    <Button type="button" label={cancelLabel} severity="secondary" onClick={onCancel} disabled={saving} />
    <Button
      type="button"
      label={saving ? "Guardando…" : saveLabel}
      onClick={onSave}
      disabled={saving || saveDisabled}
      loading={saving}
    />
  </div>
);

export default function DpContentSet({
  title,
  cancelLabel = "Cancelar",
  onCancel,
  saveLabel = "Guardar",
  onSave,
  saving = false,
  saveDisabled = false,
  variant = "panel",
  visible,
  onHide,
  children,
}: DpContentSetProps) {
  const footerEl = footer(cancelLabel, saveLabel, onCancel, onSave, saving, saveDisabled);

  // Modo dialog: contenido con scroll y footer siempre visible abajo
  if (visible !== undefined) {
    return (
      <Dialog
        header={title}
        visible={visible}
        onHide={onHide ?? onCancel}
        style={{ width: "36rem", maxHeight: "90vh" }}
        contentStyle={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}
        closable={!saving}
        closeOnEscape={!saving}
        dismissableMask={!saving}
        blockScroll
        modal
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-4">
            <div className="flex flex-col gap-4">{children}</div>
          </div>
          <div className="flex-shrink-0 border-t border-zinc-200 bg-zinc-50/80 px-6 py-4 [&>div]:mt-0 dark:border-navy-600 dark:bg-navy-900/50">
            {footerEl}
          </div>
        </div>
      </Dialog>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-4">
        {children}
        {footerEl}
      </div>
    );
  }

  return (
    <Panel header={title}>
      <div className="space-y-4">
        {children}
        {footerEl}
      </div>
    </Panel>
  );
}
