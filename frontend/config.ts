import { Platform } from "react-native"

// Set EXPO_PUBLIC_BACKEND_URL at build time to point at the live API.
// Without it, web uses the local backend and the Android emulator uses its host alias.
const LOCAL_BACKEND_URL = Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";

export const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || LOCAL_BACKEND_URL).replace(/\/+$/, "");
