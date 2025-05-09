import React, { useEffect } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePage } from '@/context/PageContext';
import { UserRole } from '@/types/types';

/**
 * withAuth Utility
 *
 * This utility function is a higher-order component that wraps a given component with authentication checks.
 * It verifies if a user is logged in and has the required role(s) to access the wrapped component.
 * If the user is not authenticated or does not have the necessary role, they are redirected to the login page.
 *
 * Key Features:
 *   - Protects components based on user authentication status and role.
 *   - Redirects unauthenticated or unauthorized users to the login page.
 *   - Displays a toast notification to inform users about the access restriction.
 *
 * Functionality:
 *   - Checks if the user is logged in and has the required role(s) upon component mount.
 *   - If the user is not authenticated or does not have the necessary role:
 *     - Displays a toast notification.
 *     - Redirects the user to the login page.
 *   - If the user is authenticated, renders the wrapped component.
 *
 * Usage:
 *   - Wrap a component with `withAuth` to protect it.
 *   - Provide an array of `UserRole` that are allowed to access the component.
 *   - Example: `export default withAuth(AdminProtectedComponent, ["ADMIN"])`
 *
 * Dependencies:
 *   - expo-router: Used for navigation and accessing the navigation state.
 *   - @/context/AuthContext: Used for accessing the user's authentication status and data.
 *   - @/context/PageContext: Used for displaying toast notifications.
 *   - @/types/types: Used for defining the UserRole type.
 */

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>, role: UserRole[]) {
    return (props: P) => {
        const { isUserLoggedIn, userData } = useAuth();
        const { showToastNotification } = usePage();
        const navigationState = useRootNavigationState();

        useEffect(() => {
            if (!navigationState?.key) return;
            if (!isUserLoggedIn || !userData?.userRole || !role.includes(userData.userRole)) {
                showToastNotification("Log in to access this page.");
                router.replace("/login");
            }
        }, [isUserLoggedIn, navigationState.key]);

        if (!isUserLoggedIn) return null;
        return <WrappedComponent {...props} />;
    };
}
