"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as routeService from "@/services/routeService";
import * as planService from "@/services/planService";
import type { PlanRecord } from "@/services/planService";

export interface SetRouteDialogProps {
  visible: boolean;
  routeId: string | null;
  onSuccess?: () => void;
}

export default function SetRouteDialog({
  visible,
  routeId,
  onSuccess,
}: SetRouteDialogProps) {
  const router = useRouter();
  const isEdit = !!routeId;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [planCode, setPlanCode] = useState<string>("");
  const [totalEstimatedKm, setTotalEstimatedKm] = useState<string>("");
  const [totalEstimatedHours, setTotalEstimatedHours] = useState<string>("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/routes");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    planService.list().then(setPlans).catch(() => setPlans([]));
    if (!routeId) {
      setName("");
      setCode("");
      setPlanId("");
      setPlanCode("");
      setTotalEstimatedKm("");
      setTotalEstimatedHours("");
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    routeService
      .getRoute(routeId)
      .then((data) => {
        if (!data) {
          setError("Ruta no encontrada.");
          return;
        }
        setName(data.name ?? "");
        setCode(data.code ?? "");
        setPlanId(data.planId ?? "");
        setPlanCode(data.planCode ?? "");
        setTotalEstimatedKm(String(data.totalEstimatedKm ?? ""));
        setTotalEstimatedHours(String(data.totalEstimatedHours ?? ""));
        setActive(data.active ?? true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, routeId]);

  // Al cargar planes, si ya hay planId (edición) rellenar planCode si estaba vacío
  // useEffect(() => {
  //   if (!planId || plans.length === 0) return;
  //   const p = plans.find((x) => x.id === planId);
  //   if (p) setPlanCode((prev) => (prev ? prev : (p.code || p.id).trim()));
  // }, [planId, plans]);

  const save = async () => {
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      console.log("planCode: ", planCode);  
      const payload = {
        name: name.trim(),
        code: code.trim(),
        planId: planId.trim(),
        planCode: planId.trim() ? planCode.trim() : "",
        totalEstimatedKm: Number(totalEstimatedKm) || 0,
        totalEstimatedHours: Number(totalEstimatedHours) || 0,
        active,
      };
      if (routeId) {
        await routeService.editRoute(routeId, payload);
      } else {
        await routeService.addRoute(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const goToStops = () => {
    if (routeId) router.push(`/transport/routes/${encodeURIComponent(routeId)}/stops`);
  };

  const planOptions = [
    { label: "— Sin plan —", value: "" },
    ...plans.map((p) => ({
      label: `${(p.code || p.id).trim()} — ${p.date} — ${p.zone}`,
      value: p.id,
    })),
  ];

  const valid = name.trim() && code.trim();
  const onPlanChange = (value: string) => {
    const id = value ?? "";
    setPlanId(id);
    const p = plans.find((x) => x.id === id);
    console.log("p: ", p);
    setPlanCode(p ? ((p.code || p.id).trim()) : "");
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar ruta" : "Agregar ruta"}
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
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Lima - Ica - Nazca - Arequipa" />
          <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="LIM-ICA-NAZ-ARE" />
          <DpInput
            type="select"
            label="Plan"
            name="planId"
            value={planId}
            onChange={(v) => onPlanChange(String(v))}
            options={planOptions}
            placeholder="Seleccione un plan (opcional)"
            filter
          />
          <DpInput type="number" label="Km estimados totales" name="totalEstimatedKm" value={totalEstimatedKm} onChange={setTotalEstimatedKm} placeholder="1010" />
          <DpInput type="number" label="Horas estimadas totales" name="totalEstimatedHours" value={totalEstimatedHours} onChange={setTotalEstimatedHours} placeholder="18" />
          <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
          {isEdit && (
            <Button label="Gestionar paradas" severity="secondary" onClick={goToStops} className="w-full" />
          )}
        </div>
      )}
    </DpContentSet>
  );
}
