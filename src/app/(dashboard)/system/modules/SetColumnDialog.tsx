"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
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

  const valid = !!name.trim() && !!header.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar columna" : "Agregar columna"}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!valid}
      visible={visible}
      onHide={onHide}
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <DpInput
          type="number"
          label="Orden"
          name="order"
          value={String(order)}
          onChange={(v) => setOrder(parseInt(v, 10) || 1)}
        />
        <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Ej. email" />
        <DpInput type="input" label="Encabezado" name="header" value={header} onChange={setHeader} placeholder="Ej. Correo" />
        <DpInput type="input" label="Formato" name="format" value={format} onChange={setFormat} placeholder="Ej. email, text" />
        <DpInput type="check" label="Participa en filtro" name="filter" value={filter} onChange={setFilter} />
      </div>
    </DpContentSet>
  );
}
