import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import MissionLink from '@/components/home/missionlink';

import AnimatedArrowHorizontal from '@/components/ui/animatedArrowHorizontal';
import AnimatedArrowVertical from '@/components/ui/animatedArrowVertical';

/**
 * Home Component
 *
 * This component serves as the main landing page of the application.
 * It displays a dynamic arrow animation that adapts based on the platform (web or native).
 *
 * Key Features:
 *   - Responsive layout that adjusts based on the platform (web or native).
 *   - Displays an animated arrow, either horizontal (web) or vertical (native).
 *   - Includes a MissionLink component in the footer.
 *   - Utilizes the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Renders a container with a dynamic arrow animation in the center.
 *   - Renders a MissionLink component in the footer, aligned to the right.
 *   - Adapts the arrow animation based on the platform (web or native).
 *
 * Components:
 *   - AnimatedArrowHorizontal: Displays a horizontal arrow animation (web).
 *   - AnimatedArrowVertical: Displays a vertical arrow animation (native).
 *   - MissionLink: Provides a link to the mission statement or related content.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const Home: React.FC = () => {

    const { theme } = useThemeContext();

    const isWeb = Platform.OS === "web";

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'column',
            width: '100%',
        },
        content: {
            flex: 1,
            height: "100%",
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        },
        arrowContainer: {
            ...(isWeb ? {
                transform: [{ translateX: "-50%" }, {translateY: "50%"}],
                justifyContent: 'center',
                alignItems: 'flex-start',
            } : {
                justifyContent: 'center',
                alignItems: 'center',
            }),
        },
        text: {
            color: theme.text,
            fontSize: 18,
        },
        footer: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginBottom: 0,
            paddingRight: 0,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.arrowContainer}>
                    {isWeb ? (
                        <AnimatedArrowHorizontal scale={1.5} collapsable={false}/>
                    ) : (
                        <AnimatedArrowVertical scale={1.3} />
                    )}
                </View>
            </View>
            <View style={styles.footer}>
                <MissionLink />
            </View>
        </View>
    );
};

export default Home;
