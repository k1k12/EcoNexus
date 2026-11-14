/**
 * Colour.ts
 *
 * This file defines the color palette and theme configurations for the Eco Nexus application.
 * It exports color constants and theme objects for both light and dark modes,
 * ensuring a consistent and customizable visual experience across the application.
 *
 * Key Features:
 *   - Defines a COLOUR object containing hexadecimal color values for branding and UI elements.
 *   - Provides separate color schemes for light and dark themes.
 *   - Exports lightTheme and darkTheme objects, each containing color properties for primary, secondary, tertiary,
 *     background primary, background secondary, and text elements.
 *   - Includes a "type" property in each theme object to indicate whether it's a light or dark theme.
 *
 * Functionality:
 *   - Provides a centralized location for managing the application's color scheme.
 *   - Simplifies the process of applying consistent styling across different components.
 *   - Enables easy switching between light and dark themes by referencing the appropriate theme object.
 *
 * Theme Properties:
 *   - primary: The primary brand color (Cambridge Blue).
 *   - secondary: The secondary brand color (Hunter Green).
 *   - tertiary: The tertiary brand color (Dark Green).
 *   - bg_primary: The primary background color (Platinum for light, deep forest green for dark).
 *   - bg_secondary: The secondary background color (Baby Powder for light, forest green for dark).
 *   - text: The text color (Black for light, off white for dark).
 *   - text_muted: Softer text for paragraphs and captions.
 *   - accent: Highlight color for main buttons and emphasis (fern on light, lime on dark).
 *   - on_accent: Text color to use on top of the accent.
 *   - type: A string indicating the theme type ("light" or "dark").
 */

export const COLOUR = {
  BRAND_PRIMARY: "#6d987aff",      // Cambridge Blue
  BRAND_SECONDARY: "#355841ff",    // Hunter Green
  BRAND_TERTIARY: "#1e2f25ff",     // Dark Green
  LIGHT: {
      BACKGROUND_PRIMARY: "#dde1ddff", // Platinum
      BACKGROUND_SECONDARY: "#fcfffaff", // Baby Powder
      TEXT: "#000000ff",               // Black
  },
  DARK: {
      BACKGROUND_PRIMARY: "#0e1b13ff", // Deep forest
      BACKGROUND_SECONDARY: "#16291dff", // Forest
      TEXT: "#eef5efff",               // Off white
  },
  ACCENT: {
      LIGHT: "#2f6b45ff",              // Fern, for buttons and highlights on light backgrounds
      DARK: "#c6f36bff",               // Lime, for buttons and highlights on dark backgrounds
  },
};

const lightTheme = {
  primary: COLOUR.BRAND_PRIMARY,
  secondary: COLOUR.BRAND_SECONDARY,
  tertiary: COLOUR.BRAND_TERTIARY,
  bg_primary: COLOUR.LIGHT.BACKGROUND_PRIMARY,
  bg_secondary: COLOUR.LIGHT.BACKGROUND_SECONDARY,
  text: COLOUR.LIGHT.TEXT,
  text_muted: "#3a4a40ff",
  accent: COLOUR.ACCENT.LIGHT,
  on_accent: "#ffffffff",
  type: "light",
};

const darkTheme = {
  primary: COLOUR.BRAND_PRIMARY,
  secondary: COLOUR.BRAND_SECONDARY,
  tertiary: COLOUR.BRAND_TERTIARY,
  bg_primary: COLOUR.DARK.BACKGROUND_PRIMARY,
  bg_secondary: COLOUR.DARK.BACKGROUND_SECONDARY,
  text: COLOUR.DARK.TEXT,
  text_muted: "#c3d3c7ff",
  accent: COLOUR.ACCENT.DARK,
  on_accent: "#0e1b13ff",
  type: "dark",
};

export { lightTheme, darkTheme };
