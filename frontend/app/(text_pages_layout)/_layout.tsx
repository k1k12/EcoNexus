import React from "react";
import { Slot } from "expo-router";
import { useThemeContext } from "@/context/ThemeContext";
import { StyleSheet, View, Platform, ImageBackground } from "react-native";
import Header from "@/components/core/Header";
import TileImage from "@/assets/images/tilewhite.png"

/**
 * TextContentLayout Component
 *
 * This component provides a layout for text-based pages within the application.
 * It adapts its structure based on the platform (web or native), providing a consistent header and content area.
 *
 * Key Features:
 *   - Platform-specific layout: Adapts its structure for web and native platforms.
 *   - Header: Includes a header component at the top of the screen.
 *   - Content Area: Provides a content area where the individual screens are rendered using the Expo Router Slot component.
 *   - Web Layout: On web, it includes a decorative image background on the left side of the content.
 *   - Native Layout: On native, it provides a simple content area.
 *   - Theme Integration: Utilizes the ThemeContext to ensure consistent styling and appearance across the application.
 *
 * Functionality:
 *   - Renders a header at the top of the screen.
 *   - Renders the content area using the Expo Router Slot component, which dynamically displays the content of the current screen.
 *   - On web, it renders a decorative image background on the left side of the content.
 *   - On native, it renders a simple content area.
 *
 * Components:
 *   - Header: Displays the application title or branding.
 *   - Slot: Renders the content of the current screen.
 *   - ImageBackground: Displays a background image on web.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

function Content() {
  const { theme } = useThemeContext();
  const isWeb = Platform.OS === "web";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg_primary,
    },
    header: {
      width: "100%",
      height: 60,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: theme.bg_primary,
    },
    webRow: {
      flex: 1,
      flexDirection: "row",
    },
    greenBox: {
      width: "30%",
      backgroundColor: theme.primary,
      borderStyle: "solid",
      borderWidth: 3,
      borderColor: theme.secondary,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      marginTop: 40,
      marginBottom: 40,
      marginRight: 20,
       overflow: 'hidden',
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg_primary,
    },
    mobileContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (isWeb) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Header />
        </View>
        <View style={styles.webRow}>
          <ImageBackground 
            source={TileImage}
            style={styles.greenBox}
            imageStyle={{ width: "100%" , height: "100%" }}

          />
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Header />
        </View>
        <View style={styles.mobileContent}>
          <Slot />
        </View>
      </View>
    );
  }
}

export default function TextContentLayout() {
  return (
      <Content />
  );
}
