import { Platform } from "react-native"

export const BACKEND_URL = Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";
