import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/constants/Colour';

/**
 * ThemeContext Component
 *
 * This component provides a context for managing the application's theme (light or dark mode).
 * It allows components to access the current theme and toggle between light and dark modes.
 * It uses the device's system color scheme as the default theme and allows users to manually override it.
 *
 * Key Features:
 *   - Provides a theme object containing color values for different UI elements.
 *   - Allows users to toggle between light and dark themes.
 *   - Uses the device's system color scheme as the default theme.
 *   - Persists the user's theme preference across app restarts.
 *
 * Functionality:
 *   - Uses the useColorScheme hook to get the device's system color scheme.
 *   - Uses the useState hook to manage the user's manual theme preference.
 *   - Provides a toggleTheme function to toggle between light and dark themes.
 *   - Provides a ThemeContext.Provider to wrap the components that need access to the theme.
 *   - Provides a useThemeContext hook to access the theme from other components.
 *
 * Context Value:
 *   - theme: An object containing color values for different UI elements.
 *   - toggleTheme: A function to toggle between light and dark themes.
 *
 * Hooks:
 *   - useColorScheme: Used to get the device's system color scheme.
 *   - useState: Used to manage the user's manual theme preference.
 *   - useContext: Used to access the ThemeContext from other components.
 */

type ThemeType = typeof lightTheme;

type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {

  const systemColorScheme = useColorScheme();
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);

  const theme =
    manualTheme !== null
      ? manualTheme === 'dark'
        ? darkTheme
        : lightTheme
      : systemColorScheme === 'dark'
      ? darkTheme
      : lightTheme;

  const toggleTheme = () => {
    setManualTheme((prev) =>
      prev !== null ? (prev === 'dark' ? 'light' : 'dark') : systemColorScheme === 'dark' ? 'light' : 'dark'
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);