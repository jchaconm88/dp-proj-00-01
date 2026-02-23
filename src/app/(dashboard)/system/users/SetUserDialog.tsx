"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import * as userService from "@/services/userService";

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
  const [role, setRole] = useState("");
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
    if (!userId) {
      setDisplayName("");
      setEmail("");
      setRole("");
      setLoading(false);
      return;
    }
    setLoading(true);
    userService
      .get(userId)
      .then((data) => {
        if (!data) {
          setError("Usuario no encontrado.");
          return;
        }
        setDisplayName(data.displayName ?? "");
        setEmail(data.email ?? "");
        setRole(Array.isArray(data.role) ? data.role.join(", ") : "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar usuario.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visible, userId]);

  const save = async () => {
    const roles = role
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      if (userId) {
        await userService.edit(userId, {
          displayName: displayName.trim() || null,
          email: email.trim(),
          role: roles,
        });
      } else {
        await userService.add({
          displayName: displayName.trim() || null,
          email: email.trim(),
          role: roles,
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
              Roles (separados por coma)
            </label>
            <InputText
              id="setuser-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="admin, editor"
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
