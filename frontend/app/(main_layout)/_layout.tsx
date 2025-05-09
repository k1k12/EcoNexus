import React from 'react';
import { Slot } from 'expo-router';
import { StyleSheet, View, Text, Platform } from "react-native";

import { useThemeContext } from "@/context/ThemeContext";
import NavBar from '@/components/core/Navbar';
import Header from "@/components/core/Header";
import { useKeyboardVisible } from '@/hooks/isKeyboardOpened';

/**
 * MainLayout Component
 *
 * This component serves as the main layout for the application, wrapping all screens within the (main_layout) route group.
 * It provides a consistent structure with a header, content area, and navigation bar.
 *
 * Key Features:
 *   - Implements a responsive layout that adapts to different screen sizes and platforms (web and native).
 *   - Includes a header component for displaying the application title or branding.
 *   - Provides a content area where the individual screens are rendered using the Expo Router Slot component.
 *   - Includes a navigation bar for navigating between different sections of the application.
 *   - Manages keyboard visibility to adjust the layout and prevent overlapping of UI elements.
 *   - Utilizes the ThemeContext to ensure consistent styling and appearance across the application.
 *
 * Functionality:
 *   - Renders a header at the top of the screen.
 *   - Renders the content area using the Expo Router Slot component, which dynamically displays the content of the current screen.
 *   - Renders a navigation bar at the bottom of the screen on native platforms, and on the side on web platforms.
 *   - Adjusts the layout based on keyboard visibility to prevent overlapping of UI elements.
 *
 * Components:
 *   - Header: Displays the application title or branding.
 *   - NavBar: Provides navigation between different sections of the application.
 *   - Slot: Renders the content of the current screen.
 *
 * Hooks:
 *   - useKeyboardVisible: Detects keyboard visibility on native platforms.
 */

function Content() {
  const { theme } = useThemeContext();
  let isKeyboardOpened;

  const isWeb = Platform.OS === "web";
  if (!isWeb) {
      isKeyboardOpened = useKeyboardVisible();
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      height: "100%",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      width: "100%",
      height: 60,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: theme.bg_primary,
    },
    page: {
      flex: 1,
      flexDirection: isWeb ? "row-reverse" : "column",
      height: "100%",
      width: "100%",
      backgroundColor: theme.bg_primary,
      alignItems: "center",
      justifyContent: "center",
    },
    navContainer: {
      alignItems: isWeb ? "flex-start" : "center",
      justifyContent: "center",
      height: isWeb ? "100%" : 60,
      width: isWeb ? 60 : "100%",
      position: "relative",
      bottom: isWeb ? "auto" : 0,
      zIndex: 10,
    },
    content: {
      flex: 1,
      width: "100%",
      height: "100%",
      paddingLeft: isWeb ? 50 : 10,
      paddingRight: isWeb ? 20 : 10,
      backgroundColor: theme.bg_primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: !isWeb && !isKeyboardOpened ? 45 : 15,
    },
    text: {
      color: theme.text,
      fontSize: 20,
    },
  });

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Header />
      </View>

      <View style={styles.page}>
        <View style={styles.content}>
          <Slot />
        </View>
        {!isWeb && !isKeyboardOpened &&
        <View style={styles.navContainer}>
          <NavBar />
        </View>
        }
        {isWeb &&
        <View style={styles.navContainer}>
          <NavBar />
        </View>
        }
      </View>

    </View>
  );
}

export default function MainLayout() {
    return (
        <Content />
    );
}
