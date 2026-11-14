import { useEffect, useState } from "react";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { DemoAccount } from "@/constants/DemoAccounts";

/**
 * useDemoLogin
 *
 * Logs in as one of the public demo accounts and opens that role's page.
 * Shared by the demo popup and the home page's "Try EcoNexus" section.
 *
 * Returns:
 *   - logInAs(account): logs in, then navigates. Resolves to true if it worked.
 *   - loadingRole: the role being logged into, or null.
 *   - error: a message to show if the last attempt failed, or null.
 */
export function useDemoLogin() {
  const { login, logout, isUserLoggedIn, userData } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<DemoAccount["route"] | null>(null);

  // Only open the account's page once the login has actually landed in the auth state,
  // otherwise the page's guard sees "logged out" for a moment and shows the log in toast
  useEffect(() => {
    if (!pendingRoute || !isUserLoggedIn || !userData) return;
    router.navigate(pendingRoute);
    setPendingRoute(null);
  }, [pendingRoute, isUserLoggedIn, userData]);

  const logInAs = async (account: DemoAccount): Promise<boolean> => {
    setError(null);
    setLoadingRole(account.role);
    if (isUserLoggedIn) {
      // Leave the current (protected) page first, so its guard doesn't see the logout and
      // show the log in toast while we're switching accounts
      router.replace("/");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await logout();
    }
    const result = await login(account.email, account.password);
    setLoadingRole(null);
    if (!result.success) {
      // The free server sleeps when nobody's used it for a while
      setError("Couldn't log in. The server may be waking up, so try again in a minute.");
      return false;
    }
    setPendingRoute(account.route);
    return true;
  };

  return { logInAs, loadingRole, error };
}
