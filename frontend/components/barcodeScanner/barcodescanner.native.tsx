import { View, Text, ViewStyle } from "react-native"
import { Camera, useCodeScanner, useCameraDevice, useCameraPermission, Code } from "react-native-vision-camera"

/**
 * BarcodeScanner (Native) Component
 *
 * This component provides a barcode scanner for native mobile platforms using the react-native-vision-camera library.
 * It requests camera permissions and utilizes the device's back camera to scan EAN-13 barcodes.
 *
 * Key Features:
 *   - Uses react-native-vision-camera for camera access and barcode scanning.
 *   - Requests camera permissions from the user.
 *   - Scans EAN-13 barcodes using the device's back camera.
 *   - Provides a callback function to handle scanned barcode values.
 *   - Displays a message if no cameras are available or if camera permissions are not granted.
 *
 * Functionality:
 *   - Checks for camera permissions and requests them if not granted.
 *   - Initializes the camera device and code scanner.
 *   - Scans for EAN-13 barcodes and extracts the barcode value.
 *   - Calls the onBarcodeScanned callback function with the scanned barcode value.
 *
 * Props:
 *   - onBarcodeScanned: A callback function that is called when a barcode is successfully scanned.
 *   - style: Optional styling for the component.
 *
 * Dependencies:
 *   - react-native-vision-camera: Used for camera access and barcode scanning.
 */

type BarcodeScannerProps = {
    onBarcodeScanned: (barcodeValue: string) => void;
    style?: ViewStyle
};

const BarcodeScanner = ({ onBarcodeScanned, style}: BarcodeScannerProps) => {
    const device = useCameraDevice("back")
    const { hasPermission, requestPermission } = useCameraPermission()

    const scanner = useCodeScanner({
        codeTypes: ["ean-13"],
        onCodeScanned: (codes: Code[]) => {
            const barcode = codes[0]?.value
            if (barcode) {
                onBarcodeScanned(barcode)
            }
        },
    })

    if (!device) return <View><Text>No Cameras Available</Text></View>

    if (!hasPermission) {
        requestPermission()
        return <View><Text>Requesting Camera Permissions...</Text></View>
    }

    return (
        <View 
        style={{
            flex: 1,
            ...style
        }}
        >
            <Camera
                style={{flex: 1}}
                device={device}
                isActive={true}
                codeScanner={scanner}
                resizeMode="cover"
            />
        </View>
    )
}

export default BarcodeScanner;
