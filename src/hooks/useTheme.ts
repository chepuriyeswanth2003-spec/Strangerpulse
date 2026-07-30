import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme(initialTheme: Theme = 'dark') {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('stranger_chat_theme');
    return (saved as Theme) || initialTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('stranger_chat_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
}
