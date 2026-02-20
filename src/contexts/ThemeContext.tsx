"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app-theme";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const value = getInitialTheme();
    setThemeState(value);
    document.documentElement.classList.toggle("dark", value === "dark");
    let link = document.getElementById("primereact-theme") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "primereact-theme";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = value === "dark" ? "/themes/primereact-dark.css" : "/themes/primereact-light.css";
  }, [mounted]);

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, value);
    document.documentElement.classList.toggle("dark", value === "dark");
    const link = document.getElementById("primereact-theme") as HTMLLinkElement | null;
    if (link) {
      link.href = value === "dark" ? "/themes/primereact-dark.css" : "/themes/primereact-light.css";
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    const link = document.getElementById("primereact-theme") as HTMLLinkElement | null;
    if (link) {
      link.href = theme === "dark" ? "/themes/primereact-dark.css" : "/themes/primereact-light.css";
    }
  }, [mounted, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx;
}
