import { useAuth } from "@/context/AuthContext";
import { usePage } from "@/context/PageContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useRegisterContext } from "@/context/RegisterContext";
import { checkValidEmail, checkValidName, checkValidPassword } from "@/utils/fieldValidators";
import { router } from "expo-router";
import { Link } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { useState } from "react";
import HoverButton from "./core/HoverButton";

/**
 * RegisterForm Component
 *
 * This component renders a registration form for new users.
 * It allows users to enter their email, password, first name, and last name to create a new account.
 * It integrates with the AuthContext for user registration and the ThemeContext for styling.
 *
 * Key Features:
 *   - Validates user input for email, password, first name, and last name.
 *   - Registers the user with the provided information using the register function from the AuthContext.
 *   - Displays toast notifications to inform the user about the status of the registration process.
 *   - Navigates the user to the login page upon successful registration.
 *   - Provides a link for council users to navigate to a separate registration form.
 *   - Uses the ThemeContext for styling.
 *   - Uses the RegisterContext to manage the registration form data.
 *
 * Functionality:
 *   - Renders a form with input fields for email, password, first name, and last name.
 *   - Validates user input using the checkValidEmail, checkValidPassword, and checkValidName functions.
 *   - Registers the user with the provided information using the register function from the AuthContext.
 *   - Displays toast notifications to inform the user about the status of the registration process.
 *   - Navigates the user to the login page upon successful registration.
 *   - Provides a link for council users to navigate to a separate registration form.
 *
 * Props:
 *   - hideCouncilPrompt: An optional boolean that hides the council registration prompt if set to true.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAuth: Provides access to the authentication functions and data.
 *   - useRegisterContext: Provides access to the registration form data.
 */

const RegisterForm = ({hideCouncilPrompt} : {hideCouncilPrompt?: boolean}) => {
    const { theme } = useThemeContext();
    const { showToastNotification } = usePage();

    const { register } = useAuth();
    const { email, password, firstName, lastName, role, areaCode, setFormData} = useRegisterContext();

    const [passwordRepeated, setPasswordRepeated] = useState<string>("");
    
    const handleResigter = async () => {
        if (!checkValidEmail(email)) {
            showToastNotification("Email must be valid.");
            return;
        }
        if (!checkValidPassword(password)) {
            showToastNotification("Password must contain at least 1 digit, both upper and lower case characters, " + 
                                  "and be at least 8 characters long.");
            return;
        }
        if (password !== passwordRepeated) {
            showToastNotification("Passwords don't match.");
            return;
        }
        if (!checkValidName(firstName)) {
            showToastNotification("First name must be valid.");
            return;
        }
        if (!checkValidName(lastName)) {
            showToastNotification("Last name must be valid.");
            return;
        }
        const registered = await register(email, password, firstName, lastName, role, areaCode)        
        if (!registered) {
            showToastNotification("Error registering your account.");
            return;
        }
        if (role === "USER") {
            showToastNotification("Registered, now you can log into your account.");
        }
        else {
            showToastNotification("Registered. Your account is under review, " + 
                                  "we will notify you via email once it's approved.");
        }
        router.navigate("/login");
    }

    return (
    <View style={{borderWidth: 0, gap: 10, width: 250, justifyContent: "center"}}>
            <View style={{gap: 10, borderWidth: 1, borderColor: "grey", 
                padding: 20, borderRadius: 10, backgroundColor: theme.bg_secondary}}
            >
                <TextInput value={email}
                onChangeText={(newVal) => setFormData({email: newVal})}
                placeholder="Email"
                placeholderTextColor={theme.text}
                style={{color: theme.text, padding: 10}}
                />
                <TextInput value={password}
                onChangeText={(newVal) => setFormData({password: newVal})}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={theme.text}
                style={{color: theme.text, padding: 10}}
                />
                <TextInput value={passwordRepeated}
                onChangeText={(newVal) => setPasswordRepeated(newVal)}
                secureTextEntry
                placeholder="Repeat password"
                placeholderTextColor={theme.text}
                style={{color: theme.text, padding: 10}}
                />
                <TextInput value={firstName}
                onChangeText={(newVal) => setFormData({firstName: newVal})}
                placeholder="First Name"
                placeholderTextColor={theme.text}
                style={{color: theme.text, padding: 10}}
                />
                <TextInput value={lastName}
                onChangeText={(newVal) => setFormData({lastName: newVal})}
                placeholder="Last Name"
                placeholderTextColor={theme.text}
                style={{color: theme.text, padding: 10}}
                />
            </View>
            <HoverButton 
            notHoveredColor={theme.bg_secondary}
            hoveredColor={theme.bg_primary}
            onClick={handleResigter}
            >
                <Text>Register</Text>
            </HoverButton>
            {!hideCouncilPrompt && (
            <Link href={{pathname: "/registerCouncil"}} style={{alignSelf: "center"}}>
                <Text style={{color: theme.text}}>You are a council? Register here.</Text>
            </Link>
            )}
        </View>
        )
}

export default RegisterForm;
