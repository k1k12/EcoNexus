"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import QRCode from "react-native-qrcode-svg"
import { useThemeContext } from "@/context/ThemeContext"

/**
 * AuthenticatorQR Component
 *
 * This component generates and displays a QR code for setting up Multi-Factor Authentication (MFA) using an authenticator app like Microsoft Authenticator.
 * It generates a random secret, creates an otpauth URL, and renders a QR code that can be scanned by the authenticator app.
 *
 * Key Features:
 *   - Generates a random secret key for MFA setup.
 *   - Creates an otpauth URL that encodes the secret key, email, and app name.
 *   - Renders a QR code using react-native-qrcode-svg that can be scanned by an authenticator app.
 *   - Displays the manual entry code (secret key) for users who cannot scan the QR code.
 *   - Uses the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Generates a random secret key using a Base32 character set.
 *   - Creates an otpauth URL with the following format:
 *     otpauth://totp/AppName:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AppName
 *   - Renders a QR code using the react-native-qrcode-svg library.
 *   - Displays the manual entry code (secret key) for users who cannot scan the QR code.
 *
 * Props:
 *   - email: The user's email address.
 *   - appName: The name of the application (default: "EcoNexus").
 *
 * Dependencies:
 *   - react-native-qrcode-svg: Used for generating QR codes.
 *   - base32-encode: Used for encoding the secret key in Base32 format.
 */

interface AuthenticatorQRProps {
  email: string
  appName?: string
}

const AuthenticatorQR = ({ email, appName = "EcoNexus" }: AuthenticatorQRProps) => {
  const { theme } = useThemeContext()
  const [otpAuthUrl, setOtpAuthUrl] = useState("")

  useEffect(() => {
    // Generate a random secret for the user
    // In a real app, you would store this secret in your database
    const generateSecret = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567" // Base32 character set
      let secret = ""
      for (let i = 0; i < 16; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return secret
    }

    const secret = generateSecret()

    // Create the otpauth URL that will be encoded in the QR code
    // Format: otpauth://totp/AppName:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AppName
    const encodedAppName = encodeURIComponent(appName)
    const encodedEmail = encodeURIComponent(email)
    const url = `otpauth://totp/${encodedAppName}:${encodedEmail}?secret=${secret}&issuer=${encodedAppName}`

    setOtpAuthUrl(url)

    // In a real app, you would save this secret to your database
    console.log("Generated TOTP secret:", secret)
  }, [email, appName])

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
    },
    qrContainer: {
      marginVertical: 5,
      padding: 10,
      backgroundColor: "#fff",
      borderRadius: 10,
      alignItems: "center",
    },
    instructions: {
      fontSize: 12,
      color: theme.text,
      marginBottom: 5,
      textAlign: "center",
      lineHeight: 16,
    },
    secretContainer: {
      marginTop: 5,
      padding: 8,
      backgroundColor: "#f0f0f0",
      borderRadius: 5,
      width: "100%",
    },
    secretText: {
      fontSize: 12,
      color: "#333",
      textAlign: "center",
      fontFamily: "monospace",
    },
  })

  // Extract the secret from the URL for display
  const secret = otpAuthUrl ? otpAuthUrl.split("secret=")[1]?.split("&")[0] : ""

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Download Microsoft Authenticator App on your phone then scan this QR code with Microsoft Authenticator app, to set up MFA for your account.
      </Text>
      {otpAuthUrl ? (
        <>
          <View style={styles.qrContainer}>
            <QRCode value={otpAuthUrl} size={150} color="black" backgroundColor="white" />
          </View>
          <View style={styles.secretContainer}>
            <Text style={styles.secretText}>Manual entry code: {secret}</Text>
          </View>
        </>
      ) : (
        <Text>Generating QR code...</Text>
      )}
    </View>
  )
}

export default AuthenticatorQR





