"use client"

import { useEffect, useRef } from "react"
import { TouchableOpacity, Animated, StyleSheet } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"

/**
 * ThemeToggle Component
 *
 * This component renders a toggle button that allows users to switch between light and dark themes.
 * It uses animated values to create a smooth transition between the two themes.
 *
 * Key Features:
 *   - Animated transition between light and dark themes.
 *   - Uses react-native-reanimated for smooth animations.
 *   - Utilizes the ThemeContext to toggle the application's theme.
 *   - Renders a sun/moon icon that changes appearance based on the current theme.
 *
 * Functionality:
 *   - Toggles the application's theme when the button is pressed.
 *   - Animates the sun/moon icon to reflect the current theme.
 *   - Uses animated values to control the scale, position, and rotation of the icon elements.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme and toggleTheme function.
 *   - useRef: Creates a persistent animated value that is not re-initialized on re-renders.
 *   - useEffect: Starts the animation when the theme changes.
 *
 * Dependencies:
 *   - react-native-reanimated: Used for creating the animated transition effect.
 *   - ThemeContext: Used for accessing and toggling the application's theme.
 */

export default function ThemeToggle() {
  const { toggleTheme, theme } = useThemeContext() 
  const isDark = theme.type === "dark"

  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isDark ? 1 : 0,
      duration: 750,
      useNativeDriver: false,
    }).start()
  }, [theme, animValue])


  const circleScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  })

  const craterScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  const rayScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const craterLeftPos = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 15],
  })

  const craterBottomPos = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 8],
  })

  const rayAnimations = Array.from({ length: 8 }).map((_, index) => {
    const rotation = index * 45
    const translateX = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -16],
    })

    return {
      rotation,
      translateX,
    }
  })

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.button}>
      <Animated.View
        style={[
          styles.icon,
          { transform: [{ scale: circleScale }] },
          { backgroundColor: theme.primary },
        ]}
      >
        <Animated.View
          style={[
            styles.crater,
            {
              backgroundColor: theme.bg_primary,
              transform: [{ scale: craterScale }],
              left: craterLeftPos,
              bottom: craterBottomPos,
            },
          ]}
        />

        {rayAnimations.map((ray, index) => (
          <Animated.View
            key={index}
            style={[
              styles.ray,
              {
                backgroundColor: theme.primary,
                transform: [
                  { rotate: `${ray.rotation}deg` },
                  { translateX: ray.translateX },
                  { scale: rayScale },]
              },
            ]}
          />
        ))}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  crater: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 10,
  },
  ray: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 6,
    left: 7,
    top: 7,
  },
})
