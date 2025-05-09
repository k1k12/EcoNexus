import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { withAuth } from "@/utils/withAuth";

import { fetchProtectedEndpoint } from "@/utils/apiCalls";
import { BACKEND_URL } from "@/config";
import LoadingScreen from "@/components/core/LoadingScreen";
import { usePage } from "@/context/PageContext";


/**
 * AdminPage Component
 *
 * This component serves as the admin dashboard, providing functionalities to manage users and approvals.
 * It displays two main sections:
 *   1. Council Users Pending Approval: A table listing council user accounts awaiting admin approval.
 *      - Allows admins to approve or reject user registration requests.
 *   2. All Registered Users: A table displaying all registered users in the system.
 *      - Shows user details such as name, email, and account type.
 *
 * Key Features:
 *   - Displays mock data for pending approvals and registered users.
 *   - Implements approve and reject functionalities for pending council users.
 *   - Uses a theme context for data and logic.
 *   - Utilizes withAuth to ensure only authorized users (ADMIN role) can access the page.
 *
 * Mock Data:
 *   - mockPendingApprovals: Array of mock user objects representing pending council approvals.
 *   - mockUsers: Array of mock user objects representing all registered users.
 *
 * Functions:
 *   - handleApprove(userId: number): Approves a pending council user with the given ID.
 *   - handleReject(userId: number): Rejects a pending council user with the given ID.
 */


const AdminPage = () => {
  const { theme } = useThemeContext()
  const [pendingGssCodes, setPendingGssCodes] = useState<string[] | null>(null);
  const { showToastNotification } = usePage();

  // Define styles at the top of the component using theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg_primary,
      // Remove all padding to ensure content is flush with edges
    },
    content: {
      alignItems: "flex-start",
      width: "100%",
      paddingTop: 20,
      paddingBottom: 20,
      paddingRight: 40,
      // No left padding to push content left
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.secondary,
      marginBottom: 20,
      marginLeft: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.secondary,
      marginTop: 30,
      marginBottom: 10,
      marginLeft: 20,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 20,
      width: "95%",
      marginLeft: 0, // No left margin
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.primary,
      padding: 10,
    },
    headerCell: {
      flex: 1,
      color: "white",
      fontWeight: "bold",
      textAlign: "left",
      justifyContent: "center"
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: `${theme.primary}30`,
      padding: 10,
    },
    cell: {
      flex: 1,
      padding: 10,
      color: theme.text,
    },
    badge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    councilBadge: {
      backgroundColor: `${theme.secondary}20`,
    },
    normalBadge: {
      backgroundColor: `${theme.primary}20`,
    },
    badgeText: {
      fontSize: 12,
      color: theme.secondary,
    },
    actionCell: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    approveButton: {
      backgroundColor: theme.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.text,
    },
    rejectButton: {
      backgroundColor: "#ef444420", //need red to colour theme
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.text,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: "500",
    },
    approveText: {
      color: theme.text,
    },
    rejectText: {
      color: theme.text,
    },
    emptyState: {
      padding: 20,
      alignItems: "center",
    },
    emptyText: {
      color: theme.text,
      opacity: 0.6,
    },
  })
  
    useEffect(() => {
        const fetchPendingApprovals = async () => {
            try {
                const response = await fetchProtectedEndpoint(`${BACKEND_URL}/pending-councils`);

                if (!response.ok) {
                    setPendingGssCodes([]);
                    return;
                }

                const data = await response.json();
                setPendingGssCodes(data.pending_councils.map((council: { gss_code: string }) => council.gss_code));
            } catch (error) {
                console.error("Error fetching pending councils:", error);
            }
        };
        fetchPendingApprovals();
    }, []); 

  const handleApprove = (approvedGssCode: string) => {
    if (!pendingGssCodes) return;
    const postApproval = async () => {
        const res = await fetchProtectedEndpoint(`${BACKEND_URL}/council-approval/${approvedGssCode}`,
                                                 {method: "PATCH"});
        if (!res.ok) {
            showToastNotification("Error, please try again.");
            return;
        }
        showToastNotification("Approved!");
        setPendingGssCodes(pendingGssCodes.filter((gssCode: string) => gssCode !== approvedGssCode))
    };
    postApproval();
  }
  
  if (!pendingGssCodes) return <LoadingScreen />;

  // Use inline styles for direct positioning
  return (
      <ScrollView
        style={{height: "100%"}}
        contentContainerStyle={{
          alignItems: "flex-start",
          justifyContent: "center",
          flexGrow: 1,
          padding: 10
        }}
      >
        <Text style={[styles.title, { marginLeft: 20 }]}>Admin Dashboard</Text>

        {/* Pending Approvals Table */}
        <Text style={[styles.sectionTitle, { marginLeft: 20 }]}>Council Users Pending Approval</Text>
        <View style={[styles.table]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.5 }, {textAlign: "center"}]}>Area code</Text>
            <Text style={[styles.headerCell, { flex: 0.5 }, {textAlign: "center"}]}>Actions</Text>
          </View>

          {pendingGssCodes.length > 0 ? (
            pendingGssCodes.map((gssCode: string) => (
              <View style={styles.row}>
                <Text style={[styles.cell, { flex: 0.5 }]}>{gssCode}</Text>
                <View style={[styles.actionCell, { flex: 0.5 }]}>
                  <Pressable style={styles.approveButton} onPress={() => handleApprove(gssCode)}>
                    <Text style={[styles.buttonText, styles.approveText]}>Approve</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending approvals</Text>
            </View>
          )}
        </View>
      </ScrollView>
  )
}

export default withAuth(AdminPage, ["ADMIN"]);
