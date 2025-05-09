import { useRef, useEffect } from "react";
import Quagga from "@ericblade/quagga2";

/**
 * BarcodeScanner Component (Web)
 *
 * This component provides a barcode scanner for web platforms using the QuaggaJS library.
 * It initializes QuaggaJS to access the device's camera and scan EAN barcodes.
 *
 * Key Features:
 *   - Uses QuaggaJS for camera access and barcode scanning on web.
 *   - Initializes QuaggaJS with specific configurations for live stream and EAN decoding.
 *   - Provides a callback function to handle scanned barcode values.
 *   - Dynamically injects a style to hide the QuaggaJS overlay.
 *
 * Functionality:
 *   - Initializes QuaggaJS with configurations for live stream and EAN decoding.
 *   - Starts QuaggaJS to begin scanning for barcodes.
 *   - Extracts the barcode value from the detected data.
 *   - Calls the onBarcodeScanned callback function with the scanned barcode value.
 *   - Cleans up QuaggaJS resources when the component unmounts.
 *
 * Props:
 *   - onBarcodeScanned: A callback function that is called when a barcode is successfully scanned.
 *   - style: Optional styling for the component.
 *
 * Dependencies:
 *   - QuaggaJS: Used for camera access and barcode scanning on web.
 */

type BarcodeScannerProps = {
    onBarcodeScanned: (barcodeValue: string) => void;
    style?: React.CSSProperties;
};

const BarcodeScanner = ({ onBarcodeScanned, style}: BarcodeScannerProps) => {
    const videoRef = useRef<any>(null);

    useEffect(() => {
        if (!document.getElementById("hide-overlay-style")) {
            const style = document.createElement("style");
            style.id = "hide-overlay-style";
            style.innerHTML = ".drawingBuffer { position: absolute; z-index: 9999; display: none;}";
            document.head.appendChild(style);
        }

        Quagga.init(
            {
                locate: true,
                inputStream: {
                    type: "LiveStream",
                    target: videoRef.current,
                    constraints: {
                        width: 1920,
                        height: 1080,
                        facingMode: "environment",
                    },
                },
                decoder: {
                    readers: ["ean_reader"],
                },
                frequency: 10,
            },
            (err: any) => {
                if (err) {
                    console.error(err);
                    return;
                }
                // Center the injected video manually
                const video = videoRef.current?.querySelector('video') as HTMLVideoElement;
                if (video) {
                    video.style.objectFit = "cover";  // stretch and center
                    video.style.width = "100%";
                    video.style.height = "100%";
                    video.style.objectPosition = "center";  // important: center it
                }
                Quagga.start();
        });

        Quagga.onDetected((data: any) => {
            const barcode: string | undefined = data?.codeResult?.code;
            if (barcode) {
                onBarcodeScanned(barcode);
            }
        });

        return () => {
            Quagga.offDetected();
            Quagga.stop();
        };
    }, []);

    return (
        <div
            ref={videoRef}
            style={{
                ...style,
                position: "relative"
            }}
        />
    );
};

export default BarcodeScanner;
