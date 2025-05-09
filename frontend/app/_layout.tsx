import { AuthContextProvider } from '@/context/AuthContext';
import PageContextProvider from '@/context/PageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Slot } from 'expo-router';

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

export default function Layout() {
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

