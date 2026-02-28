import { useEffect } from "react";

export default function ThemeToggle() {
  // Always apply dark theme
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  // Component is hidden - dark theme is always active
  return null;
}
