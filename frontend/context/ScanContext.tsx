import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Material, ScannedItem, ScanningSteps } from "@/types/types";
import { BACKEND_URL } from "@/config";

/**
 * ScanContext Component
 *
 * This component provides a context for managing the state of the scanning process throughout the application.
 * It stores the last scanned item, a list of available materials, and provides a function to update the current scanning step.
 *
 * Key Features:
 *   - Manages the last scanned item data.
 *   - Manages a list of available materials for recycling.
 *   - Provides a function to update the current scanning step.
 *   - Fetches the list of available materials from the backend API on component mount.
 *
 * Functionality:
 *   - Stores the last scanned item in a state variable.
 *   - Stores the list of available materials in a state variable.
 *   - Provides a setStep function to update the current scanning step.
 *   - Fetches the list of available materials from the backend API on component mount.
 *
 * Context Value:
 *   - setStep: A function to update the current scanning step.
 *   - lastScannedItem: The last scanned item data.
 *   - setLastScannedItem: A function to update the last scanned item data.
 *   - materialList: A list of available materials for recycling.
 *
 * Hooks:
 *   - useState: Used to manage the last scanned item and the list of available materials.
 *   - useEffect: Used to fetch the list of available materials from the backend API on component mount.
 *   - useContext: Used to access the ScanContext from other components.
 */

type ScanContextType = {
    setStep: React.Dispatch<React.SetStateAction<ScanningSteps>>;
    lastScannedItem: ScannedItem;
    setLastScannedItem: React.Dispatch<React.SetStateAction<ScannedItem>>;
    materialList: Material[];
};

const ScanContext = createContext<ScanContextType | null>(null);

export const ScanContextProvider = ({ children, setStep}: 
                                { children: ReactNode, 
                                 setStep: React.Dispatch<React.SetStateAction<ScanningSteps>>}
) => {
    const [lastScannedItem, setLastScannedItem] = useState<any>(null);
    const [materialList, setMaterialList] = useState<Material[]>([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            const materialsResponse = await fetch(`${BACKEND_URL}/materials`);
            if (!materialsResponse.ok) {
                console.error("ScanContext: Materials cannot be fetched");
            }
            const materials = await materialsResponse.json();
            setMaterialList(materials.map((material: any) => {
                return {
                    id: material.material_id,
                    name: material.name
                }
            }));
        };
        fetchMaterials();
    }, []);

    return (
        <ScanContext.Provider value={{setStep, lastScannedItem, setLastScannedItem, materialList}}>
            {children}
        </ScanContext.Provider>
    );
};

export const useScanContext = () => {
    const context = useContext(ScanContext);
    if (!context) {
        throw new Error("useAuth must be called within AuthContextProvider");
    }
    return context;
}
