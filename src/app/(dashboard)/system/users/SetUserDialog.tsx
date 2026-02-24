"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import * as userService from "@/services/userService";
import * as roleService from "@/services/roleService";
import type { RoleRecord } from "@/services/roleService";

export interface SetUserDialogProps {
  /** Si es true, se muestra el diálogo. */
  visible: boolean;
  /** Si viene un id, se edita; si es null, se crea. */
  userId: string | null;
  onSuccess?: () => void;
}

export default function SetUserDialog({ visible, userId, onSuccess }: SetUserDialogProps) {
  const router = useRouter();
  const isEdit = !!userId;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/system/users");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    let cancelled = false;
    setLoading(true);
    roleService
      .list()
      .then((list) => {
        if (cancelled) return;
        setRoles(list);
        if (!userId) {
          setDisplayName("");
          setEmail("");
          setSelectedRoleIds([]);
          setLoading(false);
          return;
        }
        return userService.get(userId).then((data) => ({ data, list }));
      })
      .then((result) => {
        if (cancelled || !result) return;
        const { data, list } = result;
        if (!data) {
          setError("Usuario no encontrado.");
          setLoading(false);
          return;
        }
        setDisplayName(data.displayName ?? "");
        setEmail(data.email ?? "");
        const roleValues = Array.isArray(data.role) ? data.role.filter((r): r is string => typeof r === "string") : [];
        const ids = roleValues.map((r) => {
          const byId = list.find((x) => x.id === r);
          if (byId) return byId.id;
          const byName = list.find((x) => x.name === r);
          return byName?.id;
        }).filter((id): id is string => !!id);
        setSelectedRoleIds(ids);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  const save = async () => {
    const roleNames = selectedRoleIds
      .map((id) => roles.find((r) => r.id === id)?.name)
      .filter((n): n is string => !!n);
    setSaving(true);
    setError(null);
    try {
      if (userId) {
        await userService.edit(userId, {
          displayName: displayName.trim() || null,
          email: email.trim(),
          role: roleNames,
        });
      } else {
        await userService.add({
          displayName: displayName.trim() || null,
          email: email.trim(),
          role: roleNames,
        });
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      header={isEdit ? "Editar usuario" : "Agregar usuario"}
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
            <label htmlFor="setuser-displayName" className="font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </label>
            <InputText
              id="setuser-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre para mostrar"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="setuser-email" className="font-medium text-zinc-700 dark:text-zinc-300">
              Correo
            </label>
            <InputText
              id="setuser-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="setuser-role" className="font-medium text-zinc-700 dark:text-zinc-300">
              Roles
            </label>
            <MultiSelect
              id="setuser-role"
              value={selectedRoleIds}
              options={roles.map((r) => ({ label: r.description || r.name, value: r.id }))}
              onChange={(e) => setSelectedRoleIds(e.value ?? [])}
              placeholder="Seleccionar roles"
              className="w-full"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button
              label={saving ? "Guardando…" : "Guardar"}
              onClick={save}
              disabled={saving || !email.trim()}
              loading={saving}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
