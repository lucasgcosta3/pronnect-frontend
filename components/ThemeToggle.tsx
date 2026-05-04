"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" aria-hidden="true" />;
  }

  const isDark = theme === "dark";

  function toggle() {
    // Add brief transition class for smooth color change
    document.documentElement.classList.add("transitioning-theme");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning-theme");
    }, 350);
  }

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-foreground/5 dark:hover:bg-foreground/10"
      aria-label="Alternar tema"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {/* Sun icon */}
      <span
        className={`material-symbols-outlined text-[22px] absolute transition-all duration-300 ${
          isDark
            ? "opacity-100 rotate-0 scale-100 text-accent"
            : "opacity-0 rotate-90 scale-50 text-foreground"
        }`}
      >
        light_mode
      </span>
      {/* Moon icon */}
      <span
        className={`material-symbols-outlined text-[20px] absolute transition-all duration-300 ${
          isDark
            ? "opacity-0 -rotate-90 scale-50 text-foreground"
            : "opacity-100 rotate-0 scale-100 text-foreground/70"
        }`}
      >
        dark_mode
      </span>
    </button>
  );
}
