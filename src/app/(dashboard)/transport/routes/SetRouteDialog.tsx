"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
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
    <Dialog
      header={isEdit ? "Editar ruta" : "Agregar ruta"}
      visible={visible}
      style={{ width: "28rem" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
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
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lima - Ica - Nazca - Arequipa"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Código</label>
            <InputText
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LIM-ICA-NAZ-ARE"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Plan</label>
            <Dropdown
              value={planId}
              options={planOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => onPlanChange(e.value ?? "")}
              placeholder="Seleccione un plan (opcional)"
              filter
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Km estimados totales</label>
            <InputText
              value={totalEstimatedKm}
              onChange={(e) => setTotalEstimatedKm(e.target.value)}
              type="number"
              placeholder="1010"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Horas estimadas totales</label>
            <InputText
              value={totalEstimatedHours}
              onChange={(e) => setTotalEstimatedHours(e.target.value)}
              type="number"
              placeholder="18"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox inputId="active" checked={active} onChange={(e) => setActive(e.checked ?? true)} />
            <label htmlFor="active" className="font-medium text-zinc-700 dark:text-zinc-300">Activo</label>
          </div>
          {isEdit && (
            <Button label="Gestionar paradas" severity="secondary" onClick={goToStops} className="w-full" />
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
