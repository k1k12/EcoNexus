"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, Platform } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import LogoDark from "@/assets/images/logo-dark.png"
import LogoLight from "@/assets/images/logo-light.png"
import CustomButton from "@/components/core/CustomButton"
import AuthenticatorQR from "@/components/core/AuthenticatorQR"
import { usePage } from "@/context/PageContext"
import { checkValidEmail, checkValidName, checkValidPassword } from "@/utils/fieldValidators"
import { useAuth } from "@/context/AuthContext"
import SelectAreaScreen from "@/components/selectAreaScreen/SelectAreaScreen"
import { LoginPages, type RegisterFields } from "@/types/types"
import LeafletContextProvider from "@/context/LeafletContext"
import { router } from "expo-router"

// npm install otplib react-native-qrcode-svg base32-encode will be needed for the QR for MFA

/**
 * MissionLoginScreen Component
 *
 * This component serves as the main login and registration page for the application.
 * It manages different states for login, account creation, council area selection, and pending approval status.
 *
 * Key Features:
 *   - Implements a multi-page flow for login and registration, including:
 *     - Homepage: Displays the application logo and prompts users to log in or create an account.
 *     - Create Account Page: Allows users to create a new account with options for normal users and council users.
 *     - Login Page: Provides a login form for existing users to enter their credentials.
 *     - Select Area Page: Allows council users to select their council area on a map.
 *     - Pending Approval Page: Displays a message indicating that the council user's account is pending approval.
 *   - Utilizes the AuthContext to handle user authentication and registration.
 *   - Integrates with the RegisterContext to manage the registration state and logic.
 *   - Uses LeafletContextProvider to provide Leaflet context to the SelectAreaScreen component on web platforms.
 *   - Implements form validation for login and registration fields.
 *   - Supports Multi-Factor Authentication (MFA) using the AuthenticatorQR component.
 *   - Redirects logged-in users to their respective dashboards based on their user role.
 *
 * Functionality:
 *   - Manages the active page using a state variable.
 *   - Handles user input and form submission for login and registration.
 *   - Validates user input and displays error messages using the usePage context.
 *   - Calls the login and register functions from the AuthContext to authenticate users and create new accounts.
 *   - Redirects users to their respective dashboards based on their user role after successful login.
 *   - Provides a platform-specific implementation for the SelectAreaScreen, wrapping it with LeafletContextProvider on web platforms.
 *
 * Components:
 *   - CustomButton: A reusable button component.
 *   - AuthenticatorQR: A component for generating and displaying a QR code for MFA setup.
 *   - SelectAreaScreen: A component for selecting a council area on a map.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAuth: Provides access to the application's authentication context for user authentication and registration.
 */

const MissionLoginScreen = () => {
  const { theme } = useThemeContext()
  const [activePage, setActivePage] = useState(LoginPages.HomePage)
  const [loginState, setLoginState] = useState<RegisterFields>({
    firstname: "",
    surname: "",
    emailLogin: "",
    areaCode: "",
    password: "",
    confirmPassword: "",
    emailRegistering: "",
    userType: "USER",
    mfaEnabled: true,
    mfaSecret: "",
    mfaCode: "",
  })

  const { showToastNotification } = usePage()
  const { login, register, isUserLoggedIn, userData} = useAuth()

  useEffect(() => {
      if (!isUserLoggedIn || !userData) return;
      if (isUserLoggedIn && userData.userRole === "USER") {
          router.navigate("/dashboard");
      }
      else if (isUserLoggedIn && userData.userRole === "COUNCIL") {
          router.navigate("/councilDashboard");
      }
      else if (isUserLoggedIn && userData.userRole === "ADMIN") {
          router.navigate("/admin");
      }
  }, [isUserLoggedIn, userData]);

  const isDarkMode = theme.type === "dark"
  const logoSource = isDarkMode ? LogoLight : LogoDark

  // Handle login with MFA
  const handleLogin = async () => {
    // Validate inputs
    if (!loginState.emailLogin || !loginState.password) {
      showToastNotification("Missing Information. Please enter both username and password.");
      return;
    }

    if (!checkValidEmail(loginState.emailLogin)) {
      showToastNotification("Email is invalid.");
      return;
    }

    // TODO : implement 2FA
    // Validate MFA code
    if (!loginState.mfaCode || loginState.mfaCode.length !== 6 || !/^\d+$/.test(loginState.mfaCode)) {
      showToastNotification("Invalid Code. Please enter a valid 6-digit code from your authenticator app.");
      return;
    }

    const loginResponse = await login(loginState.emailLogin, loginState.password);

    if (loginResponse.success) {
      showToastNotification("Welcome back!");
    } else {
      showToastNotification(loginResponse.message);
    }
  }

  // Handle account creation
  const handleCreateAccount = () => {
    if (!loginState.firstname || !loginState.surname) {
      showToastNotification("Please enter both first name and surname");
      return;
    }

    if (!checkValidName(loginState.firstname)) {
      console.log(loginState.firstname);
      showToastNotification("Please enter valid first name.");
      return;
    }

    if (!checkValidName(loginState.surname)) {
      showToastNotification("Please enter valid surname.");
      return;
    }

    if (!checkValidEmail(loginState.emailRegistering)) {
      showToastNotification("Invalid email");
      return;
    }

    if (!checkValidPassword(loginState.password)) {
      showToastNotification(
        "Password must contain both uppercase and lowercase characters, " + 
        "a digit and be at least 8 characters long",
      );
      return;
    }

    if (loginState.password !== loginState.confirmPassword) {
      showToastNotification("Passwords don't match");
      return;
    }

    if (loginState.userType === "COUNCIL") {
      setActivePage(LoginPages.SelectArea)
    } else {
      register(loginState)
        .then((response) => {
          if (response.success) {
            showToastNotification("Account created, you can log in now")
            setLoginState(prev => ({...prev, password: ""}));
            setActivePage(LoginPages.LoginPage)
          } else {
            showToastNotification(response.message)
          }
        })
    }
  }

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      flex: 1,
      backgroundColor: theme.bg_primary,
    },
    loginContainer: {
      alignItems: "center",
      width: "100%",
      marginTop: 40,
    },
    logo: {
      width: 150,
      height: 150,
      marginBottom: 1,
      marginTop: 1,
    },
    title: {
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 20,
      color: theme.text,
      textAlign: "center",
    },
    textInput: {
      width: 250,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 15,
      color: theme.text,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.text,
      marginBottom: 15,
      textAlign: "center",
    },
    loginButton: {
      marginBottom: 20,
      marginTop: 1,
      alignSelf: "center",
    },
    linkText: {
      color: theme.text,
      textDecorationLine: "underline",
    },
    navRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 10,
    },
    navButton: {
      marginHorizontal: 10,
    },
    label: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    userTypeContainer: {
      width: 250,
      marginBottom: 10,
    },
    radioGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.primary,
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    radioButtonSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    radioLabel: {
      fontSize: 14,
      color: theme.text,
    },
    mfaContainer: {
      width: 250,
      marginBottom: 10,
      alignItems: "center",
    },
    mfaCodeLabel: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 5,
      marginTop: 10,
      color: theme.text,
      textAlign: "center",
    },
    mfaDivider: {
      height: 1,
      backgroundColor: theme.primary,
      width: 250,
      marginVertical: 10,
      opacity: 0.5,
    },
    mfaCodeInput: {
      width: 150,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 20,
      color: theme.text,
      fontSize: 20,
      textAlign: "center",
      letterSpacing: 5,
    },
    extraPadding: {
      paddingBottom: 100,
    },
    pendingContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      width: "100%",
      maxWidth: 500,
      flex: 1,
    },
    titleWrapper: {
      alignItems: "center",
      marginBottom: 20,
      marginTop: 20,
    },
    titleContainer: {
      position: "relative",
      alignItems: "center",
    },
    underline: {
      position: "absolute",
      bottom: -2,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.primary,
      width: "auto",
    },
    quoteContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    italicText: {
      fontStyle: "italic",
      fontSize: 18,
      color: theme.text,
    },
    contentCard: {
      backgroundColor: theme.bg_secondary,
      borderRadius: 12,
      flexGrow: 0,
      marginHorizontal: 10,
      marginBottom: 20,
      padding: 15,
      width: "100%",
      maxWidth: 450,
    },
    boldText: {
      fontWeight: "bold",
    },
    sectionTitle: {
      fontWeight: "bold",
      fontSize: 18,
      color: theme.text,
      marginBottom: 8,
    },
  })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {activePage === LoginPages.HomePage && (
        <View style={styles.loginContainer}>
          <Text style={[styles.title, { color: theme.secondary }]}>EcoNexus</Text>
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>
            Scan <Text style={{ color: theme.secondary }}>Sort</Text> Save
          </Text>
          <CustomButton title="Login" onPress={() => setActivePage(LoginPages.LoginPage)} style={styles.loginButton} />
          <TouchableOpacity onPress={() => setActivePage(LoginPages.CreateAccountPage)}>
            <Text style={[styles.paragraph, styles.linkText]}>No Account? click here to create one</Text>
          </TouchableOpacity>
        </View>
      )}

      {activePage === LoginPages.CreateAccountPage && (
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Create Account</Text>

          {/* First Name Input */}
          <TextInput
            placeholder="First Name"
            placeholderTextColor={theme.text}
            autoCapitalize="words"
            style={styles.textInput}
            value={loginState.firstname}
            onChangeText={(text) => setLoginState({ ...loginState, firstname: text })}
          />

          {/* Surname Input */}
          <TextInput
            placeholder="Surname"
            placeholderTextColor={theme.text}
            autoCapitalize="words"
            style={styles.textInput}
            value={loginState.surname}
            onChangeText={(text) => setLoginState({ ...loginState, surname: text })}
          />

          {/* Email Input */}
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor={theme.text}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}
            value={loginState.emailRegistering}
            onChangeText={(text) => setLoginState({ ...loginState, emailRegistering: text })}
          />

          {/* Password Input */}
          <TextInput
            placeholder="Enter Password"
            placeholderTextColor={theme.text}
            secureTextEntry
            style={styles.textInput}
            value={loginState.password}
            onChangeText={(text) => setLoginState({ ...loginState, password: text })}
          />

          {/* Confirm Password Input */}
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={theme.text}
            secureTextEntry
            style={styles.textInput}
            value={loginState.confirmPassword}
            onChangeText={(text) => setLoginState({ ...loginState, confirmPassword: text })}
          />

          {/* User Type Selection */}
          <View style={styles.userTypeContainer}>
            <Text style={styles.label}>Account Type:</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setLoginState({ ...loginState, userType: "USER" })}
              >
                <View style={[styles.radioButton, loginState.userType === "USER" && styles.radioButtonSelected]} />
                <Text style={styles.radioLabel}>Normal User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setLoginState({ ...loginState, userType: "COUNCIL" })}
              >
                <View style={[styles.radioButton, loginState.userType === "COUNCIL" && styles.radioButtonSelected]} />
                <Text style={styles.radioLabel}>Council User</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MFA Setup - Using the imported component with user's email */}
          <View style={styles.mfaContainer}>
            <Text style={styles.label}>Multi-Factor Authentication:</Text>
            <AuthenticatorQR email={loginState.emailRegistering || "user@example.com"} appName="EcoNexus" />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navRow}>
            <CustomButton title="Back" onPress={() => setActivePage(LoginPages.HomePage)} style={styles.navButton} />

            <CustomButton title="Create" onPress={handleCreateAccount} />
          </View>
        </View>
      )}

      {activePage === LoginPages.LoginPage && (
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Login</Text>

          {/* Username/Email Input */}
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.text}
            autoCapitalize="none"
            style={styles.textInput}
            value={loginState.emailLogin}
            onChangeText={(text) => setLoginState({ ...loginState, emailLogin: text })}
          />

          {/* Password Input */}
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.text}
            secureTextEntry
            style={styles.textInput}
            value={loginState.password}
            onChangeText={(text) => setLoginState({ ...loginState, password: text })}
          />

          {/* MFA Code Section */}
          <View style={styles.mfaDivider} />
          <Text style={styles.mfaCodeLabel}>Authenticator Code</Text>

          {/* MFA Code Input */}
          <TextInput
            placeholder="000000"
            placeholderTextColor={theme.text}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.mfaCodeInput}
            value={loginState.mfaCode}
            onChangeText={(text) => {
              // Only allow digits
              const numericText = text.replace(/[^0-9]/g, "")
              setLoginState({ ...loginState, mfaCode: numericText })
            }}
          />
          <View style={styles.navRow}>
            <CustomButton title="Back" onPress={() => setActivePage(LoginPages.HomePage)} style={styles.navButton} />
            <CustomButton title="Login" onPress={handleLogin} style={styles.navButton} />
          </View>
        </View>
      )}

      {/* Council Select Area Page */}
      {activePage === LoginPages.SelectArea &&
        (Platform.OS === "web" ? (
          <LeafletContextProvider>
            <SelectAreaScreen registerData={loginState} setRegisterData={setLoginState} setPage={setActivePage}/>
          </LeafletContextProvider>
        ) : (
          <SelectAreaScreen registerData={loginState} setRegisterData={setLoginState} setPage={setActivePage}/>
        ))}

      {/* Pending Approval for Council Page */}
      {activePage === LoginPages.PendingApproval && (
        <View style={styles.pendingContainer}>
          {/* Title with underline */}
          <View style={styles.titleWrapper}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Registration Form Submitted</Text>
              <View style={styles.underline} />
            </View>
          </View>

          <View style={styles.quoteContainer}>
            <Text style={styles.italicText}>Your Council Account is Pending Approval</Text>
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.paragraph}>
              Thank you for registering as a <Text style={styles.boldText}>Council User</Text>. Your account has been
              created and is now pending approval from our admin team.
            </Text>
            <Text style={styles.paragraph}>
              You will receive an email notification once your account has been approved. This process typically takes{" "}
              <Text style={styles.boldText}>1-2 business days</Text>.
            </Text>
            <Text style={styles.paragraph}>
              In the meantime, you can continue using EcoNexus anonymously to explore our features.
            </Text>
          </View>

          {/* Home button */}
          <View style={styles.navRow}>
            <CustomButton
              title="Return to Home"
              onPress={() => setActivePage(LoginPages.HomePage)}
              style={{ minWidth: 200 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default MissionLoginScreen
