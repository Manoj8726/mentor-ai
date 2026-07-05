import { createContext, useContext } from "react";

export interface ThemeContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

// Minimal Context Placeholder
export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
