import UsersTable from "./UsersTable";

export const metadata = {
  title: "Inicio",
  description: "Lista de usuarios",
};

export default function HomePage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          home works!
        </h1>
      </div>
      <div className="p-6">
        <UsersTable />
      </div>
    </div>
  );
}
