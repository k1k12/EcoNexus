import { MotiView } from "moti";
import UserMap from "@/app/(main_layout)/usermap";
import { Platform, StyleSheet, Text, View } from "react-native";
import HoverButton from "../core/HoverButton";
import { useThemeContext } from "@/context/ThemeContext";
import ArrowIcon from "@/assets/icons/arrow";
import { useScanContext } from "@/context/ScanContext";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/config";
import { usePage } from "@/context/PageContext";
import { useState } from "react";
import { fetchProtectedEndpoint } from "@/utils/apiCalls";
import { router } from "expo-router";

/**
 * MapForScannedItem Component
 *
 * This component displays a map with recycling points for a scanned item.
 * It allows users to select a recycling point and mark the item as recycled.
 *
 * Key Features:
 *   - Displays a map with recycling points that accept the scanned item's material.
 *   - Allows users to select a recycling point from the map.
 *   - Provides a "Recycle" button to mark the item as recycled at the selected point.
 *   - Uses the ThemeContext for styling.
 *   - Uses MotiView for animated transitions.
 *   - Uses the ScanContext to access the last scanned item.
 *   - Uses the AuthContext to check if the user is logged in.
 *   - Uses the PageContext to display toast notifications.
 *
 * Functionality:
 *   - Fetches the last scanned item from the ScanContext.
 *   - Displays a map with recycling points that accept the scanned item's material.
 *   - Allows users to select a recycling point from the map.
 *   - When a point is selected, displays a "Recycle" button.
 *   - When the "Recycle" button is pressed, sends a request to the backend to mark the item as recycled.
 *   - Displays toast notifications to inform the user about the status of the recycle action.
 *   - Uses MotiView for animated transitions when the component is mounted or unmounted.
 *
 * Props:
 *   - onClose: A function to call when the close button is pressed.
 *
 * Components:
 *   - UserMap: A component that displays the map with recycling points.
 *   - HoverButton: A reusable button component with hover effect.
 *   - ArrowIcon: Displays an arrow icon.
 *   - MotiView: Used for animated transitions.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useScanContext: Provides access to the last scanned item.
 *   - useAuth: Provides access to the user's authentication status.
 *   - usePage: Provides access to the showToastNotification function.
 */

const MapForScannedItem = ({onClose} : {onClose: () => void}) => {
    const { lastScannedItem } = useScanContext();
    const { theme } = useThemeContext();
    const { isUserLoggedIn } = useAuth();
    const { showToastNotification } = usePage();

    const [showRecycleButton, setShowRecycleButton] = useState<boolean>(false);
    const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

    const isWeb = Platform.OS === "web";

    if (!lastScannedItem) return null;
    
    const handlePointSelect = (pointId: number) => {
        setSelectedPointId(pointId);
        setShowRecycleButton(true);
    };

    const handlePointDeselect = () => {
        setSelectedPointId(null); 
        setShowRecycleButton(false);
    };

    const handleRecycle = async () => {
        if (!lastScannedItem) {
            throw new Error("LastScannedItem is null. How did that happen?...");
        }
        try {
            const response = await fetchProtectedEndpoint(`${BACKEND_URL}/recycle`, {
                method: "POST",
                headers: {"Content-Type" : "application/json"},
                body: JSON.stringify({
                    recycling_point_id: selectedPointId,
                    product_quantities: {
                        [lastScannedItem.barcode] : 1
                    }
                })
            });
            if (!response.ok) {
                showToastNotification("Please try again");
                return;
            }
            showToastNotification("Thank you for making the world better!");
            router.replace("/scan");
            handlePointDeselect();
        }
        catch {
            showToastNotification("Network error");
        }
    };

    return (
        <MotiView
        key="map"
        from={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flex: 1,
            borderRadius: 10,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            gap: 10,
        }}>
        {isWeb && (
            <HoverButton
            onClick={onClose}
            style={{
                borderWidth: 0,
                width: 40,
                height: 40,
                position: "absolute",
                bottom: 5,
                left: 20,
                zIndex: 9,
            }}
            notHoveredColor={theme.bg_secondary}
            hoveredColor={theme.bg_primary}
            >
                <ArrowIcon rotation={180} width={20} height={20} stroke={theme.primary}/>
            </HoverButton>
        )}
        {isUserLoggedIn && showRecycleButton && isWeb && (
            <MotiView
            key="recyclebutton"
            from={{opacity: 0, }}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{
                position: "absolute",
                justifyContent: "center",
                alignItems: "center",
                bottom: 10,
                width: "50%",
                zIndex: 999999999,
            }}
            >
                <HoverButton 
                onClick={handleRecycle}
                style={{
                    flex: 1,
                    maxWidth: 500,
                    minWidth: 150
                }}>
                    <Text style={{fontSize: 22}}>Recycle!</Text>
                </HoverButton>
            </MotiView>
        )}
            <UserMap onPointSelect={handlePointSelect} onPointDeselect={handlePointDeselect} materialId={lastScannedItem.material.id}/>
        {isUserLoggedIn && showRecycleButton && !isWeb && (
            <MotiView
            key="recyclebutton"
            from={{opacity: 0, }}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                flexShrink: 1,
                zIndex: 999999999,
            }}
            >
                <HoverButton 
                onClick={handleRecycle}
                style={{
                    width: "100%",
                    maxWidth: 500,
                    minWidth: 150
                }}>
                    Recycle!
                </HoverButton>
            </MotiView>
        )}
        </MotiView>
    )
}

const styles = StyleSheet.create({
    row : {
        paddingVertical: 5,
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    underline : {
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: "grey",
    },
    headerText : {
        textAlign: "center", 
        fontSize: 18, 
        fontWeight: "bold"
    }
});

export default MapForScannedItem;
