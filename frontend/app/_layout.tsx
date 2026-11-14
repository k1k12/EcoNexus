import { AuthContextProvider } from '@/context/AuthContext';
import PageContextProvider from '@/context/PageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

/**
 * Root Layout Component
 *
 * This component serves as the root layout for the entire application.
 * Its primary purpose is to wrap the application with essential context providers,
 * ensuring that all screens have access to necessary state and functionality.
 *
 * Key Features:
 *   - Wraps the entire application with ThemeProvider, providing access to the application's theme.
 *   - Wraps the application with PageContextProvider, providing access to page-level context and notifications.
 *   - Wraps the application with AuthContextProvider, providing access to authentication-related state and functions.
 *   - Uses the Expo Router Slot component to render the active screen within the application.
 *
 * Functionality:
 *   - Provides a centralized location for initializing and managing application-wide context.
 *   - Ensures that all screens within the application have access to the necessary context providers.
 *   - Does not render any UI elements directly, but rather serves as a container for the application's content.
 *
 * Context Providers:
 *   - ThemeProvider: Provides access to the application's theme for styling.
 *   - PageContextProvider: Provides access to page-level context and notifications.
 *   - AuthContextProvider: Provides access to authentication-related state and functions.
 *
 * Components:
 *   - Slot: Renders the content of the current screen.
 */

// The council map editor and a few bits of the map are plain html, so without this
// they fall back to the browser's default serif font.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const fallbackFont = document.createElement('style');
    fallbackFont.textContent = 'body, input, textarea, select, button { font-family: SpaceGrotesk_400Regular, system-ui, sans-serif; }';
    document.head.appendChild(fallbackFont);
}

export default function Layout() {
    // Not waiting for these: text shows in the default font until they arrive.
    // The files live in assets/fonts rather than coming from the npm packages, because
    // Cloudflare Pages doesn't upload anything inside a node_modules folder.
    useFonts({
        SpaceGrotesk_400Regular: require('@/assets/fonts/SpaceGrotesk_400Regular.ttf'),
        SpaceGrotesk_500Medium: require('@/assets/fonts/SpaceGrotesk_500Medium.ttf'),
        SpaceGrotesk_600SemiBold: require('@/assets/fonts/SpaceGrotesk_600SemiBold.ttf'),
        SpaceGrotesk_700Bold: require('@/assets/fonts/SpaceGrotesk_700Bold.ttf'),
        Caveat_700Bold: require('@/assets/fonts/Caveat_700Bold.ttf'),
    });

    return (
        <ThemeProvider>
            <PageContextProvider>
                <AuthContextProvider>
                    <Slot />
                </AuthContextProvider>
            </PageContextProvider>
        </ThemeProvider>
    );
}

