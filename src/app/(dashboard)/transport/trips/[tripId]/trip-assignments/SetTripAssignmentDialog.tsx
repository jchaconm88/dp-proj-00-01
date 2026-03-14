"use client";

import { useState, useEffect, useMemo } from "react";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripAssignmentService from "@/services/tripAssignmentService";
import type { AssignmentEntityType } from "@/services/tripAssignmentService";
import * as positionService from "@/services/positionService";
import * as employeeService from "@/services/employeeService";
import * as resourceService from "@/services/resourceService";
import type { ResourceCostRecord } from "@/services/resourceService";
import * as sequenceService from "@/services/sequenceService";
import { TRIP_ASSIGNMENT_ENTITY_TYPE, statusToSelectOptions } from "@/constants/statusOptions";

const ENTITY_TYPE_OPTIONS = statusToSelectOptions(TRIP_ASSIGNMENT_ENTITY_TYPE);

export interface SetTripAssignmentDialogProps {
  visible: boolean;
  tripId: string;
  assignmentId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

function displayNameFromEntity(
  entityType: AssignmentEntityType,
  entityId: string,
  employeesByPosition: Awaited<ReturnType<typeof employeeService.list>>,
  resourcesByPosition: Awaited<ReturnType<typeof resourceService.listResources>>
): string {
  if (entityType === "employee") {
    const e = employeesByPosition.find((emp) => emp.id === entityId);
    return e ? `${(e.firstName ?? "").trim()} ${(e.lastName ?? "").trim()}`.trim() || e.code || "" : "";
  }
  const r = resourcesByPosition.find((res) => res.id === entityId);
  return r ? `${(r.firstName ?? "").trim()} ${(r.lastName ?? "").trim()}`.trim() || r.code || "" : "";
}

export default function SetTripAssignmentDialog({
  visible,
  tripId,
  assignmentId,
  onSuccess,
  onHide,
}: SetTripAssignmentDialogProps) {
  const isEdit = !!assignmentId;
  const [code, setCode] = useState("");
  const [positionId, setPositionId] = useState("");
  const [position, setPosition] = useState("");
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [entityType, setEntityType] = useState<AssignmentEntityType>("employee");
  const [entityId, setEntityId] = useState("");
  const [resourceCostId, setResourceCostId] = useState("");
  const [resourceCosts, setResourceCosts] = useState<ResourceCostRecord[]>([]);
  const [employees, setEmployees] = useState<Awaited<ReturnType<typeof employeeService.list>>>([]);
  const [resources, setResources] = useState<Awaited<ReturnType<typeof resourceService.listResources>>>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    positionService.list().then((list) => setPositions(list)).catch(() => setPositions([]));
    employeeService.list().then(setEmployees).catch(() => setEmployees([]));
    resourceService.listResources().then(setResources).catch(() => setResources([]));
    if (!assignmentId) {
      setCode("");
      setPositionId("");
      setPosition("");
      setEntityType("employee");
      setEntityId("");
      setResourceCostId("");
      setResourceCosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      tripAssignmentService.get(assignmentId),
      positionService.list(),
      employeeService.list(),
      resourceService.listResources(),
    ])
      .then(([data, positionList, employeeList, resourceList]) => {
        if (!data) {
          setError("Asignación no encontrada.");
          return;
        }
        setPositions(positionList);
        setEmployees(employeeList);
        setResources(resourceList);
        setCode(data.code ?? "");
        setPosition(data.position ?? "");
        const byName = positionList.find((p) => (p.name || "").trim() === (data.position || "").trim());
        setPositionId(byName ? byName.id : "");
        setEntityType(data.entityType ?? "employee");
        setEntityId(data.entityId ?? "");
        setResourceCostId(data.resourceCostId ?? "");
        if (data.entityType === "resource" && data.entityId) {
          resourceService.listResourceCosts(data.entityId).then(setResourceCosts).catch(() => setResourceCosts([]));
        } else {
          setResourceCosts([]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, assignmentId]);

  useEffect(() => {
    if (entityType === "resource" && entityId.trim()) {
      resourceService.listResourceCosts(entityId).then(setResourceCosts).catch(() => setResourceCosts([]));
    } else {
      setResourceCosts([]);
      setResourceCostId("");
    }
  }, [entityType, entityId]);

  const positionOptions = useMemo(
    () => positions.map((p) => ({ label: p.name, value: p.id })),
    [positions]
  );

  const pid = (positionId ?? "").trim();

  const employeesByPosition = useMemo(
    () => employees.filter((e) => (e.positionId ?? "").trim() === pid),
    [employees, pid]
  );
  const resourcesByPosition = useMemo(
    () => resources.filter((r) => (r.positionId ?? "").trim() === pid),
    [resources, pid]
  );

  const entityOptions = useMemo(() => {
    if (!pid) return [];
    if (entityType === "employee") {
      return employeesByPosition.map((e) => ({
        value: e.id,
        label: `${(e.firstName ?? "").trim()} ${(e.lastName ?? "").trim()}`.trim() || e.code || e.id,
      }));
    }
    return resourcesByPosition.map((r) => ({
      value: r.id,
      label: `${(r.firstName ?? "").trim()} ${(r.lastName ?? "").trim()}`.trim() || r.code || r.id,
    }));
  }, [pid, entityType, employeesByPosition, resourcesByPosition]);

  const selectedEntityMatchesPosition = useMemo(() => {
    const eid = String(entityId ?? "").trim();
    if (!eid || !pid) return false;
    if (entityType === "employee") {
      return employeesByPosition.some((e) => String(e.id ?? "").trim() === eid);
    }
    return resourcesByPosition.some((r) => String(r.id ?? "").trim() === eid);
  }, [entityId, pid, entityType, employeesByPosition, resourcesByPosition]);

  const resourceCostOptions = useMemo(
    () =>
      resourceCosts.map((c) => {
        const parts = [c.code, c.name].filter(Boolean);
        const codeName = parts.length ? parts.join(" - ") : c.id;
        return { value: c.id, label: `${codeName} - ${c.amount} ${c.currency}` };
      }),
    [resourceCosts]
  );

  const computedDisplayName = useMemo(
    () => displayNameFromEntity(entityType, entityId, employeesByPosition, resourcesByPosition),
    [entityType, entityId, employeesByPosition, resourcesByPosition]
  );

  const onPositionChange = (v: string | number | boolean | null) => {
    const id = v != null ? String(v) : "";
    setPositionId(id);
    const found = positions.find((p) => p.id === id);
    setPosition(found ? found.name : "");
    setEntityId("");
    setResourceCostId("");
  };

  useEffect(() => {
    if (pid && entityId && !selectedEntityMatchesPosition) {
      setEntityId("");
      setResourceCostId("");
    }
  }, [pid, entityId, selectedEntityMatchesPosition]);

  const onEntityChange = (v: string | number | boolean | null) => {
    const id = v != null ? String(v) : "";
    setEntityId(id);
    setResourceCostId("");
  };

  const save = async () => {
    if (isEdit && !code.trim()) return;
    if (!pid) {
      setError("Seleccione una posición.");
      return;
    }
    if (!selectedEntityMatchesPosition) {
      setError("El empleado o recurso debe tener la posición seleccionada.");
      return;
    }
    if (entityType === "resource" && resourceCostOptions.length > 0 && !resourceCostId.trim()) {
      setError("Seleccione el costo del recurso.");
      return;
    }
    const positionName = position.trim() || (positions.find((p) => p.id === positionId)?.name ?? "");
    const displayNameToSave = computedDisplayName.trim();
    setSaving(true);
    setError(null);
    try {
      let finalCode = code.trim();
      if (!isEdit) {
        try {
          finalCode = await sequenceService.resolveCodeIfEmpty(code, "trip-assignment");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al generar código.");
          setSaving(false);
          return;
        }
      }
      const payload = {
        code: finalCode,
        tripId: tripId.trim(),
        entityType,
        entityId: entityId.trim(),
        position: positionName,
        displayName: displayNameToSave,
        ...(entityType === "resource" && resourceCostId.trim() ? { resourceCostId: resourceCostId.trim() } : {}),
      };
      if (assignmentId) {
        await tripAssignmentService.edit(assignmentId, payload);
      } else {
        await tripAssignmentService.add(payload);
      }
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid =
    (isEdit ? !!code.trim() : true) &&
    !!pid &&
    !!String(entityId ?? "").trim() &&
    selectedEntityMatchesPosition &&
    (entityType !== "resource" || !!resourceCostId.trim() || resourceCostOptions.length === 0);

  return (
    <DpContentSet
      title={isEdit ? "Editar asignación" : "Agregar asignación"}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!valid}
      visible={visible}
      onHide={onHide}
    >
      {loading ? (
        <div className="py-8 text-center text-zinc-500">Cargando…</div>
      ) : (
        <div className="flex flex-col gap-4 pt-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <DpCodeInput
            entity="trip-assignment"
            label="Código"
            name="code"
            value={code}
            onChange={setCode}
          />
          <DpInput
            type="input"
            label="Viaje (ID)"
            name="tripId"
            value={tripId}
            onChange={() => {}}
            placeholder=""
            disabled
          />
          <DpInput
            type="select"
            label="Posición"
            name="position"
            value={positionId}
            onChange={(v) => onPositionChange(v)}
            options={positionOptions}
            placeholder="Seleccionar posición"
          />
          <DpInput
            type="select"
            label="Tipo"
            name="entityType"
            value={entityType}
            onChange={(v) => {
              setEntityType(v as AssignmentEntityType);
              setEntityId("");
              setResourceCostId("");
            }}
            options={ENTITY_TYPE_OPTIONS}
            placeholder="Empleado o Recurso"
          />
          <DpInput
            type="select"
            label={entityType === "employee" ? "Empleado (con la posición seleccionada)" : "Recurso (con la posición seleccionada)"}
            name="entityId"
            value={entityId}
            onChange={(v) => onEntityChange(v)}
            options={entityOptions}
            placeholder={pid ? (entityType === "employee" ? "Seleccionar empleado con esta posición" : "Seleccionar recurso con esta posición") : "Primero seleccione una posición"}
            disabled={!pid}
          />
          {entityType === "resource" && entityId && (
            <DpInput
              type="select"
              label="Costo del recurso"
              name="resourceCostId"
              value={resourceCostId}
              onChange={(v) => setResourceCostId(v != null ? String(v) : "")}
              options={resourceCostOptions}
              placeholder="Seleccionar costo"
            />
          )}
        </div>
      )}
    </DpContentSet>
  );
}
