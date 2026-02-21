"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EditUserDialogProps {
  visible: boolean;
  userId: string | null;
  onSuccess?: () => void;
}

interface UserData {
  displayName: string | null;
  email: string;
  role: string[];
}

export default function EditUserDialog({ visible, userId, onSuccess }: EditUserDialogProps) {
  const router = useRouter();
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
    if (!visible || !userId || !db) return;
    setLoading(true);
    setError(null);
    getDoc(doc(db, "users", userId))
      .then((snap) => {
        if (!snap.exists()) {
          setError("Usuario no encontrado.");
          return;
        }
        const data = snap.data() as UserData;
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
    if (!db || !userId) return;
    const roles = role
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", userId), {
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
      header="Editar usuario"
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
            <label htmlFor="edit-displayName" className="font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </label>
            <InputText
              id="edit-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre para mostrar"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-email" className="font-medium text-zinc-700 dark:text-zinc-300">
              Correo
            </label>
            <InputText
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-role" className="font-medium text-zinc-700 dark:text-zinc-300">
              Roles (separados por coma)
            </label>
            <InputText
              id="edit-role"
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
