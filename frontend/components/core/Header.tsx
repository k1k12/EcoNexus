import React from "react";
import {View,Text,Image,StyleSheet,Pressable,  Platform,} from "react-native";
import ThemeToggle from "@/components/core/ThemeToggle";
import LogoDark from "@/assets/images/logo-dark.png";
import LogoLight from "@/assets/images/logo-light.png";
import SignInIcon from "@/assets/icons/signin";

import { useAuth } from "@/context/AuthContext";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";

/**
 * Header Component
 *
 * This component renders the header section of the application, providing branding, theme toggle, and sign-in/sign-out functionality.
 * It adapts its appearance based on the platform (web or native) and the user's authentication status.
 *
 * Key Features:
 *   - Displays the application logo and name.
 *   - Provides a theme toggle for switching between light and dark themes.
 *   - Implements sign-in/sign-out functionality based on the user's authentication status.
 *   - Adapts its appearance based on the platform (web or native).
 *   - Utilizes the AuthContext to manage user authentication status and sign-out functionality.
 *   - Uses the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Renders a container with the application logo, name, theme toggle, and sign-in/sign-out options.
 *   - Displays the appropriate logo based on the current theme (light or dark).
 *   - Implements a handleSignIn function to navigate to the login page.
 *   - Implements a logout function to sign the user out.
 *   - Adapts the sign-in/sign-out options based on the platform (web or native) and the user's authentication status.
 *
 * Components:
 *   - ThemeToggle: Provides a toggle for switching between light and dark themes.
 *   - SignInIcon: Displays a sign-in icon.
 *
 * Hooks:
 *   - useAuth: Provides access to the application's authentication context for user authentication and sign-out functionality.
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const Header = () => {

  const { isUserLoggedIn, logout } = useAuth();
  const { theme } = useThemeContext();

  const isDarkMode = theme.type === "dark";
  const logoSource = isDarkMode ? LogoLight : LogoDark;

  
  const isWeb = Platform.OS === "web";

  const handleSignIn = () => {
    router.navigate("/login");
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      height: "100%",
      paddingHorizontal: 10,
      backgroundColor: theme.bg_primary,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 40,
      height: 40,
    },
    logoText: {
      marginLeft: 8,
      fontSize: 20,
      color: theme.primary,
    },
    flexGrow: {
      flex: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
    },

    signInRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 20, 
    },
    
    signInTextWrapper: {
      marginRight: 12 ,
    },

    signInIconWrapper: {
      marginRight: 12,
    },
    
    signInText: {
      fontSize: 15,
      fontWeight: 700,
      color: theme.primary,
    },
  });
    
  return (
    <View style={styles.container}>
      
      <View style={styles.left}>
        <Pressable onPress={() => router.navigate("/")} style={{flexDirection: "row", alignItems: "center"}}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            <Text style={styles.logoText}>Eco Nexus</Text>
        </Pressable>
      </View>

      <View style={styles.flexGrow} />

      <View style={styles.right}>
        <ThemeToggle />
        <View style={styles.signInRow}>
          {isUserLoggedIn ? (
            <Pressable style={styles.signInTextWrapper} onPress={logout}>
              <Text style={styles.signInText}>Logout</Text>
            </Pressable>
          ) : (
            <>
              {isWeb && (
                <Pressable style={styles.signInTextWrapper} onPress={handleSignIn}>
                  <Text style={styles.signInText}>Sign In / Create Account</Text>
                </Pressable>
              )}
              <Pressable style={styles.signInIconWrapper} onPress={handleSignIn}>
                <SignInIcon stroke={theme.primary} />
              </Pressable>
            </>
          )}
        </View>      
      </View>
    </View>
  );
};

export default Header;

