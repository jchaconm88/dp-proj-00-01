import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión en tu cuenta",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Introduce tu email y contraseña
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center">
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
