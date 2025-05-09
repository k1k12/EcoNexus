"use client"
import { TouchableOpacity, Text, StyleSheet, View, Platform } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { Link } from "expo-router"
import InfoIcon from "@/assets/icons/info"

/**
 * MissionLink Component
 *
 * This component renders a link to the application's mission statement page.
 * It displays the text "Our Mission" with an underline and an info icon.
 *
 * Key Features:
 *   - Navigates to the /mission route when pressed.
 *   - Uses theming from ThemeContext for consistent styling.
 *   - Uses platform-specific styling for text size.
 *   - Uses an info icon to visually represent the link.
 *
 * Functionality:
 *   - Renders a TouchableOpacity containing the mission statement text and info icon.
 *   - Navigates to the /mission route when the TouchableOpacity is pressed.
 *   - Applies styles from the StyleSheet and the ThemeContext.
 *
 * Components:
 *   - Link: Provides navigation to the mission page.
 *   - InfoIcon: Displays an info icon.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const MissionLink = () => {

  const { theme } = useThemeContext()

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
    },
    textContainer: {
      position: "relative",
      marginRight: 6,
    },
    text: {
      fontSize: Platform.OS === "web" ? 20 : 14,
      color: theme.text,
      fontWeight: "600",
    },
    underline: {
      position: "absolute",
      bottom: -2,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.primary,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
    },
  })

  return (
    <Link href={{ pathname: "/mission" }} asChild>
      <TouchableOpacity style={styles.container} accessibilityRole="link">
        <View style={styles.textContainer}>
          <Text style={styles.text}>Our Mission</Text>
          <View style={styles.underline} />
        </View>
        <View style={styles.iconContainer}>
          <InfoIcon width={24} height={24} stroke={theme.text} />
        </View>
      </TouchableOpacity>
    </Link>
  )
}

export default MissionLink
