import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS} from 'react-native-reanimated';
import { useThemeContext } from '@/context/ThemeContext';

/**
 * ToastNotification Component
 *
 * This component renders a toast notification with animated appearance and disappearance.
 * It uses react-native-reanimated for smooth animations and ThemeContext for styling.
 *
 * Key Features:
 *   - Animated appearance and disappearance using react-native-reanimated.
 *   - Customizable message and duration.
 *   - Theming support via the ThemeContext.
 *   - Uses a shared value for translateY to control the vertical position of the toast.
 *   - Uses a shared value for opacity to control the visibility of the toast.
 *   - Provides a hook (useToastNotification) for displaying toast notifications from other components.
 *
 * Functionality:
 *   - Animates the toast notification to slide in from the top of the screen.
 *   - Displays the toast notification for a specified duration.
 *   - Animates the toast notification to slide out of the screen.
 *   - Calls the onHide callback function when the toast notification disappears.
 *
 * Props:
 *   - message: The message to display in the toast notification.
 *   - duration: The duration (in milliseconds) for which the toast notification is displayed.
 *   - onHide: A callback function that is called when the toast notification disappears.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useSharedValue: Creates a shared value that can be animated using react-native-reanimated.
 *   - useAnimatedStyle: Creates an animated style object that can be applied to a View.
 *
 * Dependencies:
 *   - react-native-reanimated: Used for creating the animated appearance and disappearance effects.
 *   - ThemeContext: Used for theming the component.
 */

const ToastNotification = ({ message, duration = 2500, onHide }: {
    message: string;
    duration?: number;
    onHide: () => void;
}) => {
    const { theme } = useThemeContext();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withTiming(20, {
            duration: 500,
            easing: Easing.out(Easing.exp),
        });
        opacity.value = withTiming(1, { duration: 500 });

        const timer = setTimeout(() => {
            translateY.value = withTiming(-100, {
                duration: 500,
                easing: Easing.in(Easing.exp),
            });
            opacity.value = withTiming(0, { duration: 500 }, () => {
                runOnJS(onHide)();
            });
        }, duration - 500);

        return () => clearTimeout(timer);
    }, [duration, message]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
        style={[
            styles.container,
            animatedStyle,
            {
                backgroundColor: theme.bg_secondary,
                borderColor: theme.tertiary,
            },
        ]}
        >
            <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
        </Animated.View>
    );
};

export const useToastNotification = () => {
    const [toast, setToast] = useState<{ message: string; duration?: number } | null>(null);

    const showToastNotification = (message: string, duration = 2500) => {
        setToast({ message, duration });
    };

    const ToastComponent = () => {
        if (!toast) return null;

        return (
            <ToastNotification
            message={toast.message}
            duration={toast.duration}
            onHide={() => setToast(null)}
            />
        );
    };

    return { showToastNotification, ToastComponent };
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        alignSelf: "center",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        zIndex: 1000,
    },
    text: {
        fontSize: 16,
    },
});

export default ToastNotification;
