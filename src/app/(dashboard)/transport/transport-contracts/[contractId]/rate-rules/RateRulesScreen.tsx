"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as contractService from "@/services/contractService";
import type { ContractRecord, RateRuleRecord } from "@/services/contractService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import { MODULE_TRANSPORT_CONTRACT, PERMISSION_CREATE, PERMISSION_UPDATE, PERMISSION_DELETE } from "@/constants/permissions";
import SetRateRuleDialog from "./SetRateRuleDialog";

import { CALCULATION_TYPE } from "@/constants/statusOptions";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Activo", column: "active", order: 3, display: true, filter: true },
  { header: "Prioridad", column: "priority", order: 4, display: true, filter: true },
  { header: "Tipo regla", column: "ruleType", order: 5, display: true, filter: true },
  { header: "Cálculo", column: "calculationType", order: 6, display: true, filter: true, type: "status", typeOptions: CALCULATION_TYPE },
  { header: "Servicio", column: "transportService", order: 7, display: true, filter: true },
  { header: "Vehículo", column: "vehicleType", order: 8, display: true, filter: true },
  { header: "Vigencia", column: "validityStr", order: 9, display: true, filter: true },
  { header: "Apilable", column: "stackable", order: 10, display: true, filter: true },
];

export interface RateRulesScreenProps {
  contractId: string;
}

export default function RateRulesScreen({ contractId }: RateRulesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<RateRuleRecord & { validityStr?: string }>>(null);
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editRuleId, setEditRuleId] = useState<string | null>(null);

  const fetchContract = async () => {
    const c = await contractService.getContract(contractId);
    setContract(c ?? null);
  };

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await contractService.listRateRules(contractId);
      tableRef.current?.setDatasource(
        list.map((r) => ({
          ...r,
          validityStr: r.validFrom && r.validTo ? `${r.validFrom} — ${r.validTo}` : "—",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar reglas.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  useEffect(() => {
    fetchRules();
  }, [contractId, refreshTrigger]);

  const handleRefresh = () => {
    fetchRules();
    fetchContract();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRANSPORT_CONTRACT)) return;
    setShowAdd(true);
    setEditRuleId(null);
  };

  const openEdit = (row: RateRuleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRANSPORT_CONTRACT)) return;
    setEditRuleId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRANSPORT_CONTRACT)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const r of selected) {
        await contractService.removeRateRule(contractId, r.id);
      }
      tableRef.current?.clearSelectedRows();
      await fetchRules();
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

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
    setShowAdd(false);
    setEditRuleId(null);
  };

  const showDialog = showAdd || !!editRuleId;
  const backToContracts = () => router.push("/transport/transport-contracts");

  return (
    <DpContentInfo
      title={contract ? `Reglas de tarifa: ${contract.contractCode}` : "Reglas de tarifa"}
      backLabel="Volver a contratos"
      onBack={backToContracts}
    >
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar reglas..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<RateRuleRecord & { validityStr?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay reglas de tarifa en este contrato."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetRateRuleDialog
        visible={showDialog}
        contractId={contractId}
        ruleId={editRuleId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditRuleId(null);
        }}
      />
    </DpContentInfo>
  );
}
