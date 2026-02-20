"use client";

import { PrimeReactProvider } from "primereact/api";

export default function PrimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrimeReactProvider>{children}</PrimeReactProvider>;
}
