"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AddUserDialogProps {
  visible: boolean;
  onSuccess?: () => void;
}

export default function AddUserDialog({ visible, onSuccess }: AddUserDialogProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/system/users");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  const save = async () => {
    if (!db) return;
    const roles = role
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, "users"), {
        displayName: displayName.trim() || null,
        email: email.trim(),
        role: roles,
      });
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
      header="Agregar usuario"
      visible={visible}
      style={{ width: "28rem" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="add-displayName" className="font-medium text-zinc-700 dark:text-zinc-300">
            Nombre
          </label>
          <InputText
            id="add-displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nombre para mostrar"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="add-email" className="font-medium text-zinc-700 dark:text-zinc-300">
            Correo
          </label>
          <InputText
            id="add-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="add-role" className="font-medium text-zinc-700 dark:text-zinc-300">
            Roles (separados por coma)
          </label>
          <InputText
            id="add-role"
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
    </Dialog>
  );
}
