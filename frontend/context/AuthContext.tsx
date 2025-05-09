import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store"
import { fetchProtectedEndpoint } from "@/utils/apiCalls";
import { BACKEND_URL } from "@/config";
import { Changes, RegisterFields, Response, UserRole } from "@/types/types";
import { matchUserRole } from "@/utils/userRoleMatcher";
import LoadingScreen from "@/components/core/LoadingScreen";

/**
 * AuthContext Component
 *
 * This component provides a context for managing user authentication and authorization throughout the application.
 * It handles user login, registration, logout, and maintains the user's session state.
 * It also persists the user's authentication status across app restarts.
 *
 * Key Features:
 *   - Manages user authentication state (logged in or not).
 *   - Provides functions for user login, registration, and logout.
 *   - Persists user authentication status using secure storage (expo-secure-store on native, cookies on web).
 *   - Fetches user data from the backend upon app startup if the user was previously authenticated.
 *   - Provides user role and GSS code (for council users) to other components via the context.
 *   - Includes a LoadingScreen component to display while the authentication state is being initialized.
 *
 * Functionality:
 *   - login: Sends a login request to the backend, receives a JWT token, stores it securely, and sets the user's authentication state.
 *   - register: Sends a registration request to the backend, creating a new user account.
 *   - logout: Clears the user's authentication state and removes the JWT token from secure storage.
 *   - setUserDataFromResponse: sets the user data from the response after a succesful login or startup.
 *   - attemptLoginOnStartup: Checks if the user was previously authenticated and if so, fetches the user's data from the backend and sets the authentication state.
 *
 * Context Value:
 *   - userData: An object containing the user's data (userRole, userId, email, firstName, lastName, gssCode) or null if the user is not logged in.
 *   - isUserLoggedIn: A boolean indicating whether the user is currently logged in.
 *   - login: A function for logging in a user.
 *   - register: A function for registering a new user.
 *   - logout: A function for logging out the current user.
 *
 * Hooks:
 *   - useState: Used to manage the user's authentication state and data.
 *   - useEffect: Used to attempt login on startup and persist the user's authentication status.
 *   - useContext: Used to access the AuthContext from other components.
 *
 * Dependencies:
 *   - expo-secure-store: Used for securely storing the JWT token on native platforms.
 *   - @/utils/apiCalls: Contains the fetchProtectedEndpoint function for making authenticated API requests.
 *   - @/config: Contains the BACKEND_URL for accessing the backend API.
 *   - @/types/types: Contains type definitions for UserRole, RegisterFields, and Response.
 *   - @/utils/userRoleMatcher: Contains the matchUserRole function for mapping user roles.
 */

type UserData = {
    userRole: UserRole;
    userId: number,
    email: string;
    firstName: string;
    lastName: string;
    gssCode?: string | undefined; // only council users have gssCode
}

type AuthContextType = {
    userData: UserData | null;
    isUserLoggedIn: boolean;
    login: (email: string, password: string) => Promise<Response>;
    register: (registerData: RegisterFields) => Promise<Response>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isUserLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [ready, setReady] = useState<boolean>(false);

    const setUserDataFromResponse = (data: any) : void => {
        if (!data.role || !data.user_id || !data.first_name || !data.last_name || !data.email) {
            console.log(data);
            throw new Error("Invalid data passed, cannot set user data.");
        }
        console.log("AuthContext - setUserDataFromResponse - data: ", data);
        setUserData({
            userRole: matchUserRole(data.role),
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            gssCode: data.gss_code ?? undefined,
            userId: data.user_id
        });
    }

    const register = async (registerData: RegisterFields) : Promise<Response> => 
    {
        if (registerData.userType === "COUNCIL" && !registerData.areaCode) {
            throw new Error("Trying to register council, but area name is not provided");
        }
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: registerData.emailRegistering,
                    first_name: registerData.firstname,
                    last_name: registerData.surname,
                    password: registerData.password,
                    gss_code: registerData.areaCode || null,
                    role: registerData.userType.toLowerCase(),
                    mfa_secret: registerData.mfaSecret,
                    mfa_code: registerData.mfaCode
                })
            });
            if (!response.ok) {
                const res = await response.json();
                return {success: false, message: res.detail};
            }
            return {success: true};
        }
        catch (error) {
            return {success: false, message: "Network error. Check your internet connection."};
        }
    }
    
    const login = async (email: string, password: string) : Promise<Response> => {
        try {
            // oauth2 requires form data to be url encoded so we do this
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });
            
            if (!response.ok) {
                const res = await response.json();
                return {success: false, message: res.detail};
            }

            const data = await response.json();
            // if running on mobile, store the token in the storage and in the state for easier access
            if (Platform.OS !== "web") {
                if (!data.access_token) {
                    throw new Error("No access_token provided in the response.");
                }
                await SecureStore.setItemAsync("access_token", data.access_token);
            }
            setUserDataFromResponse(data);
            setIsLoggedIn(true);
            return {success: true};
        }
        catch (error) {
            return {success: false, message: "Network error. Check your internet connection."};
        }
    };
    
    const logout = async () => {
        setIsLoggedIn(false);
        setUserData(null);
        if (Platform.OS === "web") {
            try {
                // the response will force the browser to delete the access_token cookie
                await fetch(`${BACKEND_URL}/logout`, {
                    method: "POST",
                    credentials: "include"
                })
            }
            catch (error) {
                console.error("Error sending logout request: ", error);
            }
        }
        else {
            // on native, we delete the cookie from the storage manually
            await SecureStore.deleteItemAsync("token");
        }
    };
    

    // when mounted, meaning when a user launches the app, we check if they were previously authenticated
    // and if they are, set user info fetched from the backend (if the token hasn't expired)
    useEffect(() => {
        const attemptLoginOnStartup = async () => {
            try {
                // we try to fetch the user info from the backend
                const response = await fetchProtectedEndpoint(`${BACKEND_URL}/user-info`, {method: "GET"})
                
                if (!response.ok) {
                    throw new Error("Could not fetch user data on startup. Login required.");
                }
                const data = await response.json();
                setUserDataFromResponse(data);
                setIsLoggedIn(true);
            }
            catch (error) {
                console.log("Error when fetching user info: ", error);
            }
            setReady(true);
        }
        attemptLoginOnStartup();
    }, []);

    return (
        <AuthContext.Provider value={{ userData, register, isUserLoggedIn, login, logout }}>
        {ready ? children: <LoadingScreen />}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be called within AuthContextProvider");
    }
    return context;
}
