import Link from "next/link";
import RegistroForm from "./RegistroForm";

export const metadata = {
  title: "Registro",
  description: "Crea una cuenta nueva",
};

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Regístrate con tu email y contraseña
          </p>
        </div>
        <RegistroForm />
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
