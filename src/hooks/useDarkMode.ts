import { useEffect, useState } from 'react';

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      document.head.appendChild(favicon);
    }
    
    const base = import.meta.env.BASE_URL ?? '/';
    
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      favicon.href = `${base}favicon-dark.svg`;
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      favicon.href = `${base}favicon-light.svg`;
    }
  }, [darkMode]);

  return [darkMode, setDarkMode] as const;
}
