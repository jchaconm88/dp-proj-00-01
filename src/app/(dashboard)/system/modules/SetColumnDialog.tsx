"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as moduleService from "@/services/moduleService";
import type { ModuleColumn } from "@/services/moduleService";

export interface SetColumnDialogProps {
  visible: boolean;
  moduleId: string;
  /** null = agregar, number = editar en ese índice */
  columnIndex: number | null;
  currentColumns: ModuleColumn[];
  onSuccess: () => void | Promise<void>;
  onHide: () => void;
}

const defaultColumn: ModuleColumn = {
  order: 1,
  name: "",
  header: "",
  filter: true,
  format: "",
};

export default function SetColumnDialog({
  visible,
  moduleId,
  columnIndex,
  currentColumns,
  onSuccess,
  onHide,
}: SetColumnDialogProps) {
  const isEdit = columnIndex !== null;
  const [order, setOrder] = useState(1);
  const [name, setName] = useState("");
  const [header, setHeader] = useState("");
  const [filter, setFilter] = useState(true);
  const [format, setFormat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (columnIndex === null) {
      const nextOrder = currentColumns.length > 0 ? Math.max(...currentColumns.map((c) => c.order)) + 1 : 1;
      setOrder(nextOrder);
      setName(defaultColumn.name);
      setHeader(defaultColumn.header);
      setFilter(defaultColumn.filter);
      setFormat(defaultColumn.format ?? "");
    } else {
      const col = currentColumns[columnIndex];
      setOrder(col?.order ?? 1);
      setName(col?.name ?? "");
      setHeader(col?.header ?? "");
      setFilter(col?.filter ?? true);
      setFormat(col?.format ?? "");
    }
  }, [visible, columnIndex, currentColumns]);

  const save = async () => {
    const trimmedFormat = format.trim();
    const value: ModuleColumn = {
      order,
      name: name.trim(),
      header: header.trim(),
      filter,
      ...(trimmedFormat ? { format: trimmedFormat } : {}),
    };
    if (!value.name || !value.header) return;
    setSaving(true);
    setError(null);
    try {
      const newColumns =
        columnIndex === null
          ? [...currentColumns, value]
          : currentColumns.map((c, i) => (i === columnIndex ? value : c));
      await moduleService.edit(moduleId, { columns: newColumns });
      await onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      header={isEdit ? "Editar columna" : "Agregar columna"}
      visible={visible}
      style={{ width: "28rem" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">Orden</label>
          <InputText
            type="number"
            value={String(order)}
            onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
          <InputText
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. email"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">Encabezado</label>
          <InputText
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder="Ej. Correo"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">Formato</label>
          <InputText
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            placeholder="Ej. email, text"
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            inputId="setcol-filter"
            checked={filter}
            onChange={(e) => setFilter(!!e.checked)}
          />
          <label htmlFor="setcol-filter" className="text-sm text-zinc-700 dark:text-zinc-300">
            Participa en filtro
          </label>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
          <Button
            label={saving ? "Guardando…" : "Guardar"}
            onClick={save}
            disabled={saving || !name.trim() || !header.trim()}
            loading={saving}
          />
        </div>
      </div>
    </Dialog>
  );
}
