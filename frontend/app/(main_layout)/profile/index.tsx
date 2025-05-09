"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Alert } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import CustomButton from "@/components/core/CustomButton"
import { usePage } from "@/context/PageContext"
import { useAuth } from "@/context/AuthContext"
import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import { checkValidName } from "@/utils/fieldValidators"
import { router } from "expo-router"
import { withAuth } from "@/utils/withAuth"
import HoverButton from "@/components/core/HoverButton"

const Profile = () => {
    const { theme } = useThemeContext()
    const { userData, logout } = useAuth()
    const { showToastNotification } = usePage()

    const [isEditing, setIsEditing] = useState(false)
    const [firstName, setFirstName] = useState(userData?.firstName || "")
    const [lastName, setLastName] = useState(userData?.lastName || "")
    const [email, setEmail] = useState(userData?.email || "")
    const [isLoading, setIsLoading] = useState(false)
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)

    const handleToggleEdit = () => {
        if (isEditing) {
            // Reset to original values when canceling
            setFirstName(userData?.firstName || "")
            setLastName(userData?.lastName || "")
        }
        setIsEditing(!isEditing)
    }

    const handleDeleteAccount = async () => {
        if (Platform.OS === 'web') {
            // For web, use browser's confirm dialog
            const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")
            if (!confirmDelete) return;
        } else {
            // For React Native, we'd use Alert.alert but we won't execute the code inside this block on web
            return;
        }

        setIsDeletingAccount(true)
        try {
            const response = await fetchProtectedEndpoint(`${BACKEND_URL}/account/${userData?.userId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const errorData = await response.json()
                showToastNotification(errorData.detail || "Failed to delete account")
                return
            }

            showToastNotification("Account deleted successfully")
            // Logout and redirect to home or login page
            logout()
            // Redirect logic here, e.g., using router.push("/login")
            router.replace("/");
        } catch (error) {
            showToastNotification("Error deleting account. Please try again.")
        } finally {
            setIsDeletingAccount(false)
        }
    }

    const handleSaveChanges = async () => {
        // Validate inputs
        if (!checkValidName(firstName) || !checkValidName(lastName)) {
            showToastNotification("Please enter valid name fields")
            return
        }

        setIsLoading(true)
        try {
            // Using the correct endpoint with user_id parameter from auth context
            const response = await fetchProtectedEndpoint(`${BACKEND_URL}/account/${userData?.userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                showToastNotification(errorData.detail || "Failed to update profile")
                return
            }

            showToastNotification("Profile updated successfully")
            setIsEditing(false)

            // Ideally, we'd update the context here, but since we don't have a direct function,
            // a page refresh or context refresh would be needed
        } catch (error) {
            showToastNotification("Error updating profile. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.bg_primary,
        },
        content: {
            padding: 20,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        title: {
            margin: 10,
            fontSize: 24,
            fontWeight: "bold",
            color: theme.text,
        },
        editButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
        },
        editButtonBg: {
            backgroundColor: theme.secondary,
        },
        errorButton: {
            backgroundColor: 'red',
        },
        saveButtonBg: {
            backgroundColor: theme.primary,
        },
        card: {
            padding: 20,
            borderRadius: 10,
            borderWidth: 1,
            backgroundColor: theme.bg_secondary,
            borderColor: theme.tertiary,
            marginBottom: 20,
        },
        fieldContainer: {
            marginBottom: 15,
        },
        fieldLabel: {
            fontSize: 16,
            marginBottom: 5,
            color: theme.text,
        },
        fieldValue: {
            fontSize: 16,
            color: theme.text,
        },
        input: {
            borderWidth: 1,
            borderRadius: 5,
            paddingVertical: Platform.OS === "web" ? 10 : 8,
            paddingHorizontal: Platform.OS === "web" ? 15 : 10,
            backgroundColor: theme.bg_secondary,
            color: theme.text,
            borderColor: theme.tertiary,
        },
        saveButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
        },
        deleteButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
            backgroundColor: '#d9534f',
            marginTop: 20,
        },
        errorText: {
            color: 'red',
            fontSize: 14,
            marginTop: 5,
        },
        buttonText: {
            color: theme.text,
        },
        deleteButtonText: {
            color: 'white',
        },
    })

    const renderField = (label: string, value: string, stateSetter?: (value: string) => void) => {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {isEditing && stateSetter ? (
                    <TextInput
                        value={value}
                        onChangeText={stateSetter}
                        style={styles.input}
                    />
                ) : (
                    <Text style={styles.fieldValue}>{value}</Text>
                )}
            </View>
        )
    }

    return (
        <ScrollView 
        style={styles.container}
        contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
        }}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Profile</Text>
                    <HoverButton
                        onClick={handleToggleEdit}
                        style={styles.editButton} 
                    >
                        <Text>{isEditing ? "Cancel" : "Edit Profile"}</Text>
                    </HoverButton>
                </View>

                <View style={styles.card}>
                    {renderField("First Name", firstName, setFirstName)}
                    {renderField("Last Name", lastName, setLastName)}
                    {renderField("Email", email, setEmail)}
                </View>

                {isEditing && (
                    <HoverButton
                        onClick={handleSaveChanges}
                        style={styles.saveButton} 
                    >
                        <Text>{isLoading ? "Saving..." : "Save Changes"}</Text>
                    </HoverButton>
                )}
                {!isEditing && (
                <HoverButton
                    onClick={handleDeleteAccount}
                    style={styles.deleteButton}
                    notHoveredColor="red"
                >
                    <Text>{isDeletingAccount ? "Deleting..." : "Delete Account"}</Text>
                </HoverButton>
                )}
            </View>
        </ScrollView>
    )
}
// Needs Auth?
export default withAuth(Profile, ["USER", "COUNCIL", "ADMIN"]);
