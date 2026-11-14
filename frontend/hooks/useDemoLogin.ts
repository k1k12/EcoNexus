import { useState } from "react";
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
  const { login, logout, isUserLoggedIn } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logInAs = async (account: DemoAccount): Promise<boolean> => {
    setError(null);
    setLoadingRole(account.role);
    if (isUserLoggedIn) {
      await logout();
    }
    const result = await login(account.email, account.password);
    setLoadingRole(null);
    if (!result.success) {
      // The free server sleeps when nobody's used it for a while
      setError("Couldn't log in. The server may be waking up, so try again in a minute.");
      return false;
    }
    router.navigate(account.route);
    return true;
  };

  return { logInAs, loadingRole, error };
}
