import { MotiView } from "moti"
import { Platform, StyleSheet, Text, View } from "react-native";
import HoverButton from "../core/HoverButton";
import { useThemeContext } from "@/context/ThemeContext";
import ArrowIcon from "@/assets/icons/arrow";
import { useScanContext } from "@/context/ScanContext";

/**
 * ItemInfo Component
 *
 * This component displays detailed information about a scanned item, including its name, packaging material, and recyclability status.
 * It provides an option to navigate to a map showing nearby recycling points if the item is recyclable.
 *
 * Key Features:
 *   - Displays product name, packaging material, and recyclability status.
 *   - Provides a button to navigate to a map showing recycling points if the item is recyclable.
 *   - Uses the ThemeContext for styling.
 *   - Uses MotiView for animated transitions.
 *   - Uses the ScanContext to access the last scanned item and set the current step.
 *
 * Functionality:
 *   - Receives the last scanned item from the ScanContext.
 *   - Displays the item's name, packaging material, and recyclability status.
 *   - If the item is recyclable, displays a button that navigates to the map view.
 *   - Uses MotiView for animated transitions when the component is mounted or unmounted.
 *   - Provides a close button to close the details viewer.
 *
 * Props:
 *   - onClose: A function to call when the close button is pressed.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *   - ArrowIcon: Displays an arrow icon.
 *   - MotiView: Used for animated transitions.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useScanContext: Provides access to the last scanned item and setStep function.
 */

const ItemInfo = ({onClose} : {onClose: () => void}) => {
    const isWeb = Platform.OS === "web";
    const { theme } = useThemeContext();

    const { lastScannedItem, setStep } = useScanContext();

    if (!lastScannedItem) return null;

    console.log("ItemInfo lastScannedItem: ", lastScannedItem);

    return (
        <MotiView
        key="info"
        from={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        style={{
            flex: 1,
            gap: 10,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: 400
        }}
        >
            <View style={[styles.row, styles.underline, { alignItems: "center" }]}>
              <HoverButton
                onClick={onClose}
                style={{
                  borderWidth: 0,
                  width: 40,
                }}
                notHoveredColor={theme.bg_primary}
                hoveredColor={theme.bg_secondary}
              >
                <ArrowIcon rotation={180} width={20} height={20} stroke={theme.primary}/>
              </HoverButton>

              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: theme.text , fontSize: 18, fontWeight: "bold"}}>Product</Text>
              </View>

              <View style={{ width: 40 }} />
            </View>            
            <View style={styles.row}>
                <Text style={[styles.headerText, {color: theme.primary}]}>Product name</Text> 
            </View>
            <View style={styles.row}>
                <Text style={{color: theme.text}}>{lastScannedItem.name}</Text> 
            </View>
            <View style={styles.row}>
                <Text style={[styles.headerText, {color: theme.primary}]}>Packaging</Text> 
            </View>
            <View style={styles.row}>
                <Text style={{color: theme.text}}>{lastScannedItem.material.name}</Text> 
            </View>
            <View style={styles.row}>
                <Text style={[styles.headerText, {color: theme.primary}]}>Can be recycled?</Text> 
            </View>
            <View style={styles.row}>
                <Text style={{color: theme.text}}>{lastScannedItem.recyclable ? "Yes" : "No"}</Text> 
            </View>
            {lastScannedItem.recyclable && (
            <View style={styles.row}>
                <HoverButton onClick={() => {setStep("MAP")}}>
                    Show recycling points
                </HoverButton>
            </View>
            )}
        </MotiView>
    )
}

export default ItemInfo;

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
