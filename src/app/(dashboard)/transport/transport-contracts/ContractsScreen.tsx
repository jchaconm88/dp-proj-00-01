"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as contractService from "@/services/contractService";
import type { ContractRecord } from "@/services/contractService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, DpTColumn, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_TRANSPORT_CONTRACT,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import { CONTRACT_STATUS, BILLING_CYCLE, CURRENCY } from "@/constants/statusOptions";

export type { ContractRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "contractCode", order: 1, display: true, filter: true },
  { header: "Cliente", column: "client", order: 2, display: true, filter: true },
  { header: "Descripción", column: "description", order: 3, display: true, filter: true },
  { header: "Moneda", column: "currency", order: 4, display: true, filter: true, type: "status", typeOptions: CURRENCY },
  { header: "Vigencia", column: "validityStr", order: 5, display: true, filter: true },
  { header: "Facturación", column: "billingCycle", order: 6, display: true, filter: true, type: "status", typeOptions: BILLING_CYCLE },
  { header: "Días pago", column: "paymentTermsDays", order: 7, display: true, filter: true },
  { header: "Estado", column: "status", order: 8, display: true, filter: true, type: "status", typeOptions: CONTRACT_STATUS },
  { header: "Reglas", column: "rateRules", order: 9, display: true, filter: false },
];

export interface ContractsScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function ContractsScreen({ refreshTrigger, onRefresh }: ContractsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ContractRecord & { validityStr?: string }>>(null);
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
      const list = await contractService.listContracts();
      tableRef.current?.setDatasource(
        list.map((c) => ({
          ...c,
          validityStr: c.validFrom && c.validTo ? `${c.validFrom} — ${c.validTo}` : "—",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contratos.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRANSPORT_CONTRACT)) return;
    router.push("/transport/transport-contracts/add");
  };

  const openEdit = (row: ContractRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRANSPORT_CONTRACT)) return;
    router.push(`/transport/transport-contracts/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRANSPORT_CONTRACT)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await contractService.removeManyContracts(selected);
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
    <DpContent title="CONTRATOS DE TRANSPORTE">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, cliente..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ContractRecord & { validityStr?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="contractCode"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay contratos en la colección "transport-contracts".'
        emptyFilterMessage="No hay resultados para el filtro."
      >
        <DpTColumn<ContractRecord & { validityStr?: string }> name="rateRules">
          {(row) => (
            <button
              type="button"
              onClick={() => router.push(`/transport/transport-contracts/${encodeURIComponent(row.id)}/rate-rules`)}
              className="p-button p-button-text p-button-rounded p-button-icon-only"
              aria-label="Ver reglas de tarifa"
              title="Reglas de tarifa"
            >
              <i className="pi pi-list" />
            </button>
          )}
        </DpTColumn>
      </DpTable>
    </DpContent>
  );
}
