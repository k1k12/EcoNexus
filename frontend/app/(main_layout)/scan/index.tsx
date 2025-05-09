import ArrowIcon from '@/assets/icons/arrow';
import BarcodeScanner from '@/components/barcodeScanner/barcodescanner';
import HoverButton from '@/components/core/HoverButton';
import ItemInfo from '@/components/scanPages/ItemInfo';
import MapForScannedItem from '@/components/scanPages/MapForScannedItem';
import Scanning from '@/components/scanPages/Scanning';
import { ScanContextProvider } from '@/context/ScanContext';
import { useThemeContext } from '@/context/ThemeContext';
import { ScanningSteps } from '@/types/types';
import { AnimatePresence, MotiView } from 'moti';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';

/**
 * Scan Component
 *
 * This component manages the scanning process for recycling items.
 * It guides the user through different steps: scanning, displaying item information, and showing a map.
 *
 * Key Features:
 *   - Uses ScanContextProvider to manage the scanning state and transition between steps.
 *   - Implements a state variable to track the current step in the scanning process.
 *   - Utilizes AnimatePresence for smooth transitions between different scanning steps.
 *   - Renders different components based on the current step:
 *     - Scanning: Displays the barcode scanner.
 *     - ItemInfo: Shows information about the scanned item.
 *     - MapForScannedItem: Displays a map related to the scanned item.
 *
 * Functionality:
 *   - Manages the current step of the scanning process using a state variable.
 *   - Conditionally renders different components based on the current step.
 *   - Provides a context for managing the scanning state and transitioning between steps.
 */

const Scan: React.FC = () => {
    const [step, setStep] = useState<ScanningSteps>("SCANNING");
    
    return (
        <ScanContextProvider setStep={setStep}>
            <View 
            style={{
                flex: 1,
                width: "100%",
                alignItems: "center",
                justifyContent: "center"
            }}
            >
                <AnimatePresence exitBeforeEnter>
                {step === "SCANNING" &&
                    <Scanning />
                }
                {step === "AFTER_SCANNED" &&
                    <ItemInfo onClose={() => {setStep("SCANNING")}}/>
                }
                {step === "MAP" &&
                    <MapForScannedItem onClose={() => {setStep("SCANNING")}}/>
                }
                </AnimatePresence>
            </View>
        </ScanContextProvider>
    );
};

export default Scan;
