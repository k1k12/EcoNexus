import { Text, View, ViewStyle } from "react-native";

/**
 * BarcodeScanner Component (Cross-Platform)
 *
 * This component serves as a placeholder for barcode scanning functionality on platforms where it is not directly supported.
 * It provides a consistent interface for barcode scanning across different platforms, while displaying a message indicating that the feature is not available on the current platform.
 *
 * Key Features:
 *   - Provides a cross-platform interface for barcode scanning.
 *   - Displays a message indicating that barcode scanning is not supported on the current platform.
 *   - Accepts a callback function to handle scanned barcode values (though it is not used on unsupported platforms).
 *
 * Functionality:
 *   - Renders a message indicating that barcode scanning is not supported on the current platform.
 *   - Does not implement any actual barcode scanning functionality.
 *   - Calls the onBarcodeScanned callback function with the scanned barcode value.
 *
 * Props:
 *   - onBarcodeScanned: A callback function that is intended to be called when a barcode is successfully scanned (not used on this platform).
 *   - style: Optional styling for the component.
 */

type BarcodeScannerProps = {
    onBarcodeScanned: (barcodeValue: string) => void;
    style?: ViewStyle | React.CSSProperties
};

const BarcodeScanner = ({ onBarcodeScanned, style}: BarcodeScannerProps) => {
    return (
        <View>
            <Text>Barcode scanning is not supported on this platform.</Text>
        </View>
    );
}

export default BarcodeScanner;
