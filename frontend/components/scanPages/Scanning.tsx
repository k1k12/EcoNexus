import { MotiView } from "moti";

import BarcodeScanner from "../barcodeScanner/barcodescanner";
import { useEffect, useRef, useState } from "react";
import { useScanContext } from "@/context/ScanContext";
import HoverButton from "../core/HoverButton";
import ArrowIcon from "@/assets/icons/arrow";
import { Platform, Text, TextInput, View } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";

import { BACKEND_URL } from "@/config";
import { usePage } from "@/context/PageContext";
import { Material } from "@/types/types";

/**
 * Scanning Component
 *
 * This component provides a barcode scanning interface for identifying recyclable items.
 * It integrates with a barcode scanner to detect and process barcodes, retrieving product information from a backend API.
 *
 * Key Features:
 *   - Utilizes a barcode scanner component to capture barcode data.
 *   - Communicates with a backend API to retrieve product information based on the scanned barcode.
 *   - Validates the product's material against a predefined list of recyclable materials.
 *   - Updates the application's state with the scanned item's details, including name, material, and recyclability status.
 *   - Provides a manual barcode input option for cases where barcode scanning is not feasible.
 *   - Uses MotiView for animated transitions.
 *   - Uses the ScanContext to manage the scanning process and state.
 *   - Uses the ThemeContext for styling.
 *   - Uses the PageContext to display toast notifications.
 *
 * Functionality:
 *   - Captures barcode data using the BarcodeScanner component.
 *   - Sends the scanned barcode to a backend API to retrieve product information.
 *   - Validates the product's material against a predefined list of recyclable materials.
 *   - Updates the application's state with the scanned item's details, including name, material, and recyclability status.
 *   - Provides a manual barcode input option for cases where barcode scanning is not feasible.
 *   - Displays toast notifications to inform the user about the status of the scanning process.
 *   - Uses MotiView for animated transitions when the component is mounted or unmounted.
 *
 * Components:
 *   - BarcodeScanner: A component for scanning barcodes.
 *   - HoverButton: A reusable button component with hover effect.
 *   - ArrowIcon: Displays an arrow icon.
 *   - MotiView: Used for animated transitions.
 *
 * Hooks:
 *   - useScanContext: Provides access to the scanning process and state.
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the showToastNotification function.
 */

const Scanning = () => {
    const [barcode, setBarcode] = useState<string | null>(null);
    const lastScanRef = useRef<number>(0);

    const { showToastNotification } = usePage();
    const { setStep, materialList, setLastScannedItem} = useScanContext();
    // without this ref, the barcode scanner uses stale callback reference which doesn't capture the full fetched material list,
    // it uses the very first version (before scan context fetches the actual list of materials) and it causes "invalid material" because
    // it cannot map item's material to any material from the list.
    const materialListRef = useRef<Material[]>(materialList);

    useEffect(() => {
        materialListRef.current = materialList;
    }, [materialList]);

    const { theme } = useThemeContext();
    
    const isWeb = Platform.OS === "web";

    const handleBarcodeScanned = async (scannedBarcode: string) => {
        const now = Date.now();
        if (now - lastScanRef.current < 500) {
            return;
        }
        lastScanRef.current = now;
        setBarcode(scannedBarcode);
        try {
            const res = await fetch(`${BACKEND_URL}/product/${scannedBarcode}`);
            if (!res.ok) {
                showToastNotification("Couldn't find this product :(");
                return;
            }
            const product = await res.json();
            const currentMaterialList = materialListRef.current;
            console.log("Scanning - materialList: ", materialList, "product: ", product);
            const material: Material | undefined = currentMaterialList.find((material: Material) => material.name.toLowerCase() === product.material.name.toLowerCase());
            if (!material) {
                showToastNotification("Invalid material");
                return;
            }
            // RECYCLABLE IS ALWAYS TRUE - backend stores only recyclable materials. If a material was matched, it's 100% recyclable.
            setLastScannedItem({name: product.name, material: material, recyclable: true, barcode: scannedBarcode});
            setStep("AFTER_SCANNED");
        } 
        catch (e) {
            console.error(e);
            showToastNotification("Network error");
        }
    }

    const handleBarcodeInputChange = (newVal: string) => {
        setBarcode(newVal);
    };
    
    return (
        <MotiView
        key="scanning"
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
            maxWidth: 600,
            gap: 10,
        }}>
            <Text style={{
                color: theme.primary, 
                textAlign: "center", 
                fontWeight: "bold",
                fontSize: isWeb ? 22 : 16
            }}>
            Scan barcode
            </Text>
            <View
            style={{
                ...(isWeb ? {} : { flex: 1 }), // only apply flex: 1 on native
                display: "flex",
                position: "relative",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
            }}
            >
                <BarcodeScanner 
                style={{
                    width: "100%",
                    borderRadius: 10,
                    overflow: "hidden"
                }}
                onBarcodeScanned={handleBarcodeScanned} 
                />
                <View style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    padding: 10,
                    width: "100%",
                    gap: 5,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <TextInput
                    value={barcode || ""}
                    inputMode="numeric"
                    style={{
                        color: theme.secondary,
                        borderRadius: 10,
                        minHeight: 30,
                        height: "100%",
                        fontWeight: "500",
                        flex: 1,
                        backgroundColor: theme.bg_secondary,
                        textAlign: "center",
                        borderWidth: 1,
                        borderColor: theme.primary
                    }}
                    placeholder={"Enter barcode"}
                    placeholderTextColor={theme.secondary}
                    onChangeText={handleBarcodeInputChange}
                    />
                    <HoverButton
                    notHoveredColor={theme.bg_secondary}
                    hoveredColor={theme.bg_primary}
                    onClick={() => {
                        if (!barcode) return;
                        handleBarcodeScanned(barcode)
                    }}
                    >
                        <ArrowIcon width={18} height={18} stroke={theme.primary} />
                    </HoverButton>
                </View>
            </View>
        </MotiView>
    );
}

export default Scanning;
