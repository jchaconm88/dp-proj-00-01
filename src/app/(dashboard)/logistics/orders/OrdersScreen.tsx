"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as orderService from "@/services/orderService";
import type { OrderRecord } from "@/services/orderService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_ORDER,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { OrderRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Cliente", column: "client", order: 2, display: true, filter: true },
  { header: "Dirección entrega", column: "deliveryAddress", order: 3, display: true, filter: true },
  { header: "Ubicación", column: "locationStr", order: 4, display: true, filter: true },
  { header: "Ventana", column: "windowStr", order: 5, display: true, filter: true },
  { header: "Peso", column: "weight", order: 6, display: true, filter: true },
  { header: "Volumen", column: "volume", order: 7, display: true, filter: true },
  { header: "Estado", column: "status", order: 8, display: true, filter: true },
];

export interface OrdersScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function OrdersScreen({ refreshTrigger, onRefresh }: OrdersScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<OrderRecord & { locationStr?: string; windowStr?: string }>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await orderService.list();
      tableRef.current?.setDatasource(
        list.map((o) => ({
          ...o,
          locationStr: `${o.location.latitude}, ${o.location.longitude}`,
          windowStr: `${o.deliveryWindowStart} - ${o.deliveryWindowEnd}`,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchList();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_ORDER)) return;
    router.push("/logistics/orders/add");
  };

  const openEdit = (row: OrderRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_ORDER)) return;
    router.push(`/logistics/orders/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_ORDER)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await orderService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  return (
    <DpContent title="PEDIDOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por cliente, dirección..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<OrderRecord & { locationStr?: string; windowStr?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="client"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay pedidos en la colección "orders".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
