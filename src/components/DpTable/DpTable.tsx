"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import type { DpTableDefColumn, DpTableRef, DpTableRow } from "./types";
import DpTColumn from "./DpTColumn";

const DEFAULT_PAGE_SIZES = [5, 10, 25];

export interface DpTableProps<T extends DpTableRow> {
  /** Definición de columnas (solo se muestran las con display: true, ordenadas por order) */
  tableDef: DpTableDefColumn[];
  /** Columna que se muestra como enlace y dispara onDetail */
  linkColumn?: string;
  /** Callback al hacer clic en la celda enlazada */
  onDetail?: (row: T) => void;
  /** Callback al hacer clic en editar */
  onEdit?: (row: T) => void;
  /** Placeholder del campo de filtro (si hay columnas con filter: true) */
  filterPlaceholder?: string;
  /** Si false, no se muestra el input de filtro en el header de la tabla (usar DpContentHeader) */
  showFilterInHeader?: boolean;
  /** Opciones de "items por página" */
  pageSizes?: number[];
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Mensaje cuando el filtro no devuelve resultados */
  emptyFilterMessage?: string;
  /** Callback cuando cambia la selección */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Columnas personalizadas (DpTColumn) para redefinir el contenido de celdas por nombre */
  children?: React.ReactNode;
}

function getCellValue(row: Record<string, unknown>, columnKey: string): unknown {
  const value = row[columnKey];
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "—";
}

function isDpTColumnChild(
  child: React.ReactNode
): child is React.ReactElement<{ name: string; children: (row: unknown) => React.ReactNode }> {
  return React.isValidElement(child) && child.type === DpTColumn;
}

function DpTableInner<T extends DpTableRow>(
  {
    tableDef,
    linkColumn,
    onDetail,
    onEdit,
    filterPlaceholder = "Filtrar…",
    showFilterInHeader = true,
    pageSizes = DEFAULT_PAGE_SIZES,
    emptyMessage = "No hay datos.",
    emptyFilterMessage = "No hay resultados para el filtro.",
    onSelectionChange,
    children,
  }: DpTableProps<T>,
  ref: React.ForwardedRef<DpTableRef<T>>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoadingState] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selection, setSelection] = useState<T[]>([]);
  const selectionRef = useRef(selection);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const columns = useMemo(
    () =>
      [...tableDef]
        .filter((c) => c.display)
        .sort((a, b) => a.order - b.order),
    [tableDef]
  );

  const filterColumns = useMemo(
    () => columns.filter((c) => c.filter !== false),
    [columns]
  );

  const globalFilterFields = useMemo(
    () => filterColumns.map((c) => c.column),
    [filterColumns]
  );

  const setDatasource = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  const clearDatasource = useCallback(() => {
    setData([]);
    setSelection([]);
  }, []);

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value);
  }, []);

  const getSelectedRows = useCallback((): T[] => {
    return selectionRef.current;
  }, []);

  const clearSelectedRows = useCallback(() => {
    setSelection([]);
  }, []);

  const filter = useCallback((value: string) => {
    setGlobalFilter(value);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setDatasource,
      clearDatasource,
      setLoading,
      getSelectedRows,
      clearSelectedRows,
      filter,
    }),
    [setDatasource, clearDatasource, setLoading, getSelectedRows, clearSelectedRows, filter]
  );

  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  const filters = useMemo(
    () => ({ global: { value: globalFilter, matchMode: "contains" as const } }),
    [globalFilter]
  );

  const header = useMemo(() => {
    if (filterColumns.length === 0 || !showFilterInHeader) return null;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={filterPlaceholder}
            className="w-full sm:w-auto"
          />
        </span>
      </div>
    );
  }, [globalFilter, filterPlaceholder, filterColumns.length, showFilterInHeader]);

  const bodyLink = useCallback(
    (row: T, col: DpTableDefColumn) => {
      const value = getCellValue(row as Record<string, unknown>, col.column);
      const isLinkColumn = linkColumn === col.column && onDetail;
      if (isLinkColumn) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDetail(row);
            }}
            className="p-link font-medium text-primary cursor-pointer border-none bg-transparent underline"
          >
            {String(value)}
          </button>
        );
      }
      return (
        <span>{String(value)}</span>
      );
    },
    [linkColumn, onDetail]
  );

  const bodyEdit = useCallback(
    (row: T) =>
      onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="p-button p-button-text p-button-rounded p-button-icon-only"
          aria-label="Editar"
        >
          <i className="pi pi-pencil" />
        </button>
      ) : null,
    [onEdit]
  );

  const columnRenderers = useMemo(() => {
    const map: Record<string, (row: T) => React.ReactNode> = {};
    React.Children.forEach(children, (child) => {
      if (isDpTColumnChild(child)) {
        const { name, children: renderFn } = child.props;
        if (name && typeof renderFn === "function") map[name] = renderFn as (row: T) => React.ReactNode;
      }
    });
    return map;
  }, [children]);

  const bodyCell = useCallback(
    (row: T, col: DpTableDefColumn) => {
      const custom = columnRenderers[col.column];
      if (custom) return custom(row);
      return bodyLink(row, col);
    },
    [columnRenderers, bodyLink]
  );

  return (
    <div className="space-y-4">
      <DataTable
        value={data}
        dataKey="id"
        loading={loading}
        selection={selection}
        onSelectionChange={(e) => setSelection(e.value ?? [])}
        selectionMode="multiple"
        metaKeySelection={false}
        paginator
        rows={pageSizes[0] ?? 5}
        rowsPerPageOptions={pageSizes}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="{first} a {last} de {totalRecords}"
        emptyMessage={globalFilter.trim() ? emptyFilterMessage : emptyMessage}
        header={header}
        filters={filters}
        globalFilterFields={globalFilterFields}
        tableStyle={{ minWidth: "50rem" }}
        size="small"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        {onEdit && (
          <Column
            headerStyle={{ width: "3rem" }}
            body={bodyEdit}
          />
        )}
        {columns.map((col) => {
          const hasCustomBody = !!columnRenderers[col.column];
          const isLinkCol = !hasCustomBody && linkColumn === col.column && onDetail;
          return (
            <Column
              key={col.column}
              field={hasCustomBody || isLinkCol ? undefined : col.column}
              sortField={col.column}
              header={col.header}
              body={(arg: T | { rowData: T }) => {
                const rowData = arg != null && typeof arg === "object" && "rowData" in arg
                  ? (arg as { rowData: T }).rowData
                  : (arg as T);
                return bodyCell(rowData, col);
              }}
            />
          );
        })}
      </DataTable>
    </div>
  );
}

const DpTable = forwardRef(DpTableInner) as <T extends DpTableRow>(
  props: DpTableProps<T> & { ref?: React.ForwardedRef<DpTableRef<T>> }
) => React.ReactElement;

export default DpTable;
