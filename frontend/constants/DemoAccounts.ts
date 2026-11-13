/**
 * DemoAccounts.ts
 *
 * Public demo logins shown in the demo popup so anyone can try each role.
 * These are meant to be public. The backend creates them only when its
 * DEMO_ACCOUNTS setting is on, resets them on every start, and won't let them
 * be changed or used on real accounts. Keep in sync with backend/src/app/core/demo.py.
 *
 * Set EXPO_PUBLIC_DEMO_ACCOUNTS=true at build time to show the popup.
 */

export const DEMO_ACCOUNTS_ENABLED = process.env.EXPO_PUBLIC_DEMO_ACCOUNTS === "true";

export type DemoAccount = {
    role: string;
    description: string;
    email: string;
    password: string;
    route: "/dashboard" | "/councilDashboard" | "/admin";
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
    {
        role: "User",
        description: "Scan products, see your recycling stats and find points on the map.",
        email: "user@demo.econexus.org.uk",
        password: "DemoUser123!",
        route: "/dashboard",
    },
    {
        role: "Council",
        description: "Manage the demo area's recycling points and see what gets recycled.",
        email: "council@demo.econexus.org.uk",
        password: "DemoCouncil123!",
        route: "/councilDashboard",
    },
    {
        role: "Admin",
        description: "Approve council accounts waiting for access.",
        email: "admin@demo.econexus.org.uk",
        password: "DemoAdmin123!",
        route: "/admin",
    },
];
