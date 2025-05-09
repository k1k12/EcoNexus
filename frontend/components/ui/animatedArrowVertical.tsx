"use client"

import { useEffect, useRef } from "react"
import { View, Text, Animated, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"
import { useThemeContext } from "@/context/ThemeContext"

/**
 * AnimatedArrowVertical Component
 *
 * This component renders an animated vertical arrow with accompanying text, designed to encourage users to scan items for recycling.
 * It utilizes React Native's Animated API and react-native-svg to create a visually engaging animation.
 *
 * Key Features:
 *   - Animates a vertical arrow using stroke dash offset.
 *   - Includes encouraging text to prompt users to scan and recycle.
 *   - Theming support via the ThemeContext.
 *   - Scalable design to fit different screen sizes.
 *   - Customizable through props for scaling.
 *
 * Functionality:
 *   - Animates the arrow's path using Animated.timing to create a drawing effect.
 *   - Uses strokeDasharray and strokeDashoffset to control the animation of the arrow.
 *   - Animates the appearance of arrowheads using Animated.timing and opacity.
 *   - Displays encouraging text with theming support.
 *   - Adjusts the size of the arrow and text based on the scale prop.
 *
 * Props:
 *   - scale: A number that scales the arrow and text (default: 1).
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useRef: Creates persistent animated values that are not re-initialized on re-renders.
 *   - useEffect: Starts the animation when the component mounts.
 *
 * Dependencies:
 *   - react-native-svg: Used for creating the vector graphics (arrow).
 *   - react-native-reanimated: Used for creating the animated transition effect.
 *   - ThemeContext: Used for accessing and toggling the application's theme.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path)

// Add prop types with scale property
interface AnimatedArrowVerticalProps {
  scale?: number
}

export default function AnimatedArrowVertical({ scale = 1 }: AnimatedArrowVerticalProps) {
  const { theme } = useThemeContext()

  // Animation values
  const dashOffset = useRef(new Animated.Value(500)).current
  const arrowheadOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Reset animation values
    dashOffset.setValue(500)
    arrowheadOpacity.setValue(0)

    // Animate the main line
    Animated.timing(dashOffset, {
      toValue: 0,
      duration: 2000,
      delay: 0,
      useNativeDriver: false,
    }).start()

    // Delay the arrowhead appearance
    setTimeout(() => {
      Animated.timing(arrowheadOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start()
    }, 1800) // Show arrowheads just before main animation ends
  }, [])

  const arrowColor = theme.primary

  // Original dimensions
  const originalWidth = 98
  const originalHeight = 228

  // Apply scale to dimensions
  const scaledWidth = originalWidth * scale
  const scaledHeight = originalHeight * scale

  const styles = StyleSheet.create({
    container: {
      width: "100%",
    },
    textContainer: {
      alignItems: "center",
      marginBottom: 10,
      marginTop: 15,
    },
    text: {
      fontWeight: "bold",
      textAlign: "center",
      color: theme.text,
    },
    greenText: {
      color: theme.primary,
      fontWeight: "bold",
    },
    arrowContainer: {
      width: "100%",
      alignItems: "center",
    },
  })

  return (
    <View style={styles.container}>
      {/* Text Component */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { fontSize: 16 * scale }]}>
          Ready to be <Text style={styles.greenText}>green?</Text> Scan
        </Text>
        <Text style={[styles.text, { fontSize: 16 * scale }]}>and keep recycling simple!</Text>
      </View>

      {/* Arrow Component */}
      <View style={[styles.arrowContainer, { marginVertical: 20 * scale }]}>
        <Svg width={scaledWidth} height={scaledHeight} viewBox={`0 0 ${originalWidth} ${originalHeight}`}>
          {/* Main line path */}
          <AnimatedPath
            d="M44.7891 3C66.5538 50.3575 95.2596 144.383 40.122 153.428C2.47728 159.603 -8.28987 109.843 33.5491 104.846C75.388 99.8492 123.983 170.663 60.7548 215.191"
            stroke={arrowColor}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="500"
            strokeDashoffset={dashOffset}
          />

          {/* Arrowhead paths with opacity animation */}
          <AnimatedPath
            d="M60.7548 215.191L58.6494 197.147"
            stroke={arrowColor}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            opacity={arrowheadOpacity}
          />

          <AnimatedPath
            d="M60.7548 215.191L83.9861 217.477"
            stroke={arrowColor}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            opacity={arrowheadOpacity}
          />
        </Svg>
      </View>
    </View>
  )
}
