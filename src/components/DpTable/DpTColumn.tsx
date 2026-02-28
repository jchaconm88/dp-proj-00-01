"use client";

import type { ReactNode } from "react";

/**
 * Props para definir una columna personalizada en DpTable (equivalente a dp-per-column en Angular).
 * El contenido (children) es una función que recibe la fila y devuelve lo que se muestra en la celda.
 */
export interface DpTColumnProps<T = unknown> {
  /** Nombre de la columna (debe coincidir con tableDef[].column) */
  name: string;
  /** Render de la celda: recibe la fila y devuelve el contenido (ej. enlace, icono, badge) */
  children: (row: T) => ReactNode;
}

/**
 * Columna personalizada para DpTable. Se usa como hijo de DpTable para redefinir
 * el contenido de una columna por nombre.
 *
 * @example
 * <DpTable tableDef={tableDef} linkColumn="documentNo" onDetail={edit}>
 *   <DpTColumn name="zip">
 *     {(row) => row.zip?.url ? <a href={row.zip.url} target="_blank" rel="noopener"><i className="pi pi-external-link" /></a> : "—"}
 *   </DpTColumn>
 *   <DpTColumn name="pdf">
 *     {(row) => row.pdf?.url ? <a href={row.pdf.url} target="_blank" rel="noopener"><i className="pi pi-file-pdf" /></a> : "—"}
 *   </DpTColumn>
 * </DpTable>
 */
function DpTColumn<T>(_props: DpTColumnProps<T>): null {
  return null;
}

export default DpTColumn;
