import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { router } from "expo-router";

import { useThemeContext } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ACCOUNTS, DemoAccount } from "@/constants/DemoAccounts";

/**
 * DemoAccountsModal Component
 *
 * Popup listing the public demo logins, one per role, so someone looking at the
 * project can try it without signing up. Each card shows the email and password
 * and has a button that logs straight in and opens that role's page.
 *
 * Props:
 *   - visible: Whether the popup is open.
 *   - onClose: Called when the popup should close.
 */

type DemoAccountsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DemoAccountsModal = ({ visible, onClose }: DemoAccountsModalProps) => {
  const { theme } = useThemeContext();
  const { login, logout, isUserLoggedIn } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logInAs = async (account: DemoAccount) => {
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
      return;
    }
    onClose();
    router.navigate(account.route);
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    card: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "90%",
      backgroundColor: theme.bg_secondary,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.secondary,
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 6,
    },
    intro: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 16,
    },
    account: {
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    role: {
      fontSize: 17,
      fontWeight: 700,
      color: theme.primary,
    },
    description: {
      fontSize: 13,
      color: theme.text,
      marginTop: 2,
      marginBottom: 8,
    },
    credential: {
      fontSize: 13,
      color: theme.text,
      fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    },
    button: {
      marginTop: 10,
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 5,
      backgroundColor: theme.secondary,
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: 700,
    },
    note: {
      fontSize: 12,
      color: theme.text,
      opacity: 0.8,
      marginTop: 4,
    },
    error: {
      fontSize: 13,
      color: "#c0392b",
      marginBottom: 8,
    },
    close: {
      marginTop: 12,
      alignSelf: "flex-end",
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: theme.secondary,
    },
    closeText: {
      color: theme.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop taps inside the card from closing the popup */}
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView>
            <Text style={styles.title}>Try EcoNexus</Text>
            <Text style={styles.intro}>
              Log in as any role to look around. There's no need to sign up.
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}

            {DEMO_ACCOUNTS.map((account) => (
              <View key={account.role} style={styles.account}>
                <Text style={styles.role}>{account.role}</Text>
                <Text style={styles.description}>{account.description}</Text>
                <Text style={styles.credential} selectable>Email: {account.email}</Text>
                <Text style={styles.credential} selectable>Password: {account.password}</Text>
                <Pressable
                  style={styles.button}
                  onPress={() => logInAs(account)}
                  disabled={loadingRole !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`Log in as the demo ${account.role}`}
                >
                  <Text style={styles.buttonText}>
                    {loadingRole === account.role ? "Logging in..." : `Log in as ${account.role}`}
                  </Text>
                </Pressable>
              </View>
            ))}

            <Text style={styles.note}>
              These accounts are shared and can't be changed, and the demo data resets regularly.
              Recycling point locations are real, from OpenStreetMap (© OpenStreetMap contributors).
              The opening times, residents and recycling history are made up for the demo, not council data.
              If you sign in with an authenticator code on the login page, any 6 digits work.
            </Text>

            <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DemoAccountsModal;
