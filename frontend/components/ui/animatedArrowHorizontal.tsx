// In @/components/ui/animatedArrowHorizontal.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useThemeContext } from '@/context/ThemeContext';

/**
 * AnimatedArrowHorizontal Component
 *
 * This component renders an animated horizontal arrow with accompanying text, designed to guide users towards the scanning functionality.
 * It utilizes React Native's Animated API and react-native-svg to create a visually engaging animation.
 *
 * Key Features:
 *   - Animates a horizontal arrow using stroke dash offset.
 *   - Includes text elements to encourage users to scan and recycle.
 *   - Theming support via the ThemeContext.
 *   - Scalable design to fit different screen sizes.
 *   - Customizable through props for scaling and collapsibility.
 *
 * Functionality:
 *   - Animates the arrow's path using Animated.timing to create a drawing effect.
 *   - Uses strokeDasharray and strokeDashoffset to control the animation of the arrow.
 *   - Displays encouraging text with theming support.
 *   - Adjusts the size of the arrow and text based on the scale prop.
 *
 * Props:
 *   - scale: A number that scales the arrow and text (default: 1).
 *   - collapsable: A boolean indicating whether the component is collapsable (default: undefined).
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%"
  },
  textContainer: {
    alignItems: "flex-end",
    marginBottom: 0,
    paddingRight: 0, 
    alignSelf: "flex-end",
  },
  text: {
    fontWeight: "bold",
    textAlign: "right",
  },
  greenText: {
    fontWeight: "bold",
  },
});

interface AnimatedArrowHorizontalProps {
  scale?: number;
  collapsable: boolean | undefined;
}

export default function AnimatedArrowHorizontal({ scale = 1, collapsable = undefined}: AnimatedArrowHorizontalProps) {
  const { theme } = useThemeContext();
  const dashValue1 = useRef(new Animated.Value(500)).current;
  const dashValue2 = useRef(new Animated.Value(50)).current;
  const dashValue3 = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(dashValue1, {
      toValue: 0,
      duration: 1500,
      delay: 0,
      useNativeDriver: false, 
    }).start();

    Animated.parallel([
      Animated.timing(dashValue2, {
        toValue: 0,
        duration: 1000,
        delay: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(dashValue3, {
        toValue: 0,
        duration: 1000,
        delay: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [dashValue1, dashValue2, dashValue3]);

  const originalWidth = 353;
  const originalHeight = 103;
  
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      position: "relative",
      top: -120,
    },
    textContainer: {
      alignItems: "flex-end",
      marginBottom: 0,
      paddingRight: 0, 
      alignSelf: "flex-end",
    },
    text: {
      color: theme.text,
      fontWeight: "bold",
      textAlign: "right",
    },
    greenText: {
      color: theme.primary,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      {/* Text Component */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { fontSize: 18 * scale }]}>
          Ready to be <Text style={styles.greenText}>green?</Text> Scan and
        </Text>
        <Text style={[styles.text, { fontSize: 18 * scale }]}>keep recycling simple!</Text>
      </View>
      {/* Arrow Component */}
      <View style={{ width: '100%', alignItems: 'center', marginVertical: 20 * scale }}>
        <Svg 
          width={scaledWidth} 
          height={scaledHeight} 
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
        >
          <G>
            <AnimatedPath
              d="M345.016 3.10144C351.499 48.0036 301.158 115.004 211.303 84.3289C121.448 53.6542 42.096 9.15567 7.57384 29.3364"
              stroke={theme.primary}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="500" 
              strokeDashoffset={dashValue1}
            />

            <AnimatedPath
              d="M7.57384 29.3364L21.1883 6.63307"
              stroke={theme.primary}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="50" 
              strokeDashoffset={dashValue2}
            />

            <AnimatedPath
              d="M7.57384 29.3364L30.9129 40.9403"
              stroke={theme.primary}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="50"
              strokeDashoffset={dashValue3}
            />
          </G>
        </Svg>
      </View>
    </View>
  );
}
