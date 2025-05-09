import { Point2D, RegisterFields, Response } from "@/types/types"
import { findContainingArea } from "@/utils/mapUtils";
import { BACKEND_URL } from "@/config";

/**
 * shared.tsx
 *
 * This file provides shared functions for the SelectAreaScreen component, handling user interactions and data fetching.
 * It includes functions for proceeding with registration, fetching council area data, handling input changes, and processing map presses.
 *
 * Key Functions:
 *   - handleProceed: Handles the registration process after the user selects an area, validating the selection and calling the register function.
 *   - getAreas: Fetches council area data from the backend and returns it as a GeoJSON FeatureCollection.
 *   - handleInputChange: Handles changes to the GSS code input field, validating the input and updating the selected area code.
 *   - handleMapPress: Handles map press events, finding the containing area and updating the selected area code.
 *
 * Functionality:
 *   - handleProceed:
 *     - Validates that an area has been selected.
 *     - Sets the area code in the registration data.
 *     - Calls the register function to register the user with the selected area.
 *     - Displays toast notifications to inform the user about the status of the registration process.
 *     - Calls the onSuccess callback function if registration is successful.
 *   - getAreas:
 *     - Fetches council area data from the backend endpoint /all-councils.
 *     - Transforms the data into a GeoJSON FeatureCollection.
 *     - Ensures that the polygon is closed (first and last points are the same).
 *   - handleInputChange:
 *     - Validates that the input is alphanumeric and uppercase.
 *     - Updates the selected area code state.
 *   - handleMapPress:
 *     - Finds the containing area based on the map press position.
 *     - Updates the selected area code state with the GSS code of the selected area.
 *
 * Dependencies:
 *   - @/types/types: Contains type definitions for Point2D, RegisterFields, and Response.
 *   - @/utils/mapUtils: Contains the findContainingArea function for finding the containing area based on a point.
 *   - @/config: Contains the BACKEND_URL for accessing the backend API.
 */

export const handleProceed = async (
    registerData : RegisterFields, 
    setRegisterData : React.Dispatch<React.SetStateAction<RegisterFields>>, 
    register: (fields: RegisterFields) => Promise<Response>, 
    areas: GeoJSON.FeatureCollection, 
    showToastNotification: (message: string) => void, 
    selectedAreaName: string,
    onSuccess?: () => void
) : Promise<void> => {
    const cannotProceed = () => {
        showToastNotification("Select your area");
    }
    if (selectedAreaName === "") {
        cannotProceed();
    }
    if (!areas.features.map(f => f.properties?.name === selectedAreaName)) {
        cannotProceed();
        return;
    }
    setRegisterData({...registerData, areaCode: selectedAreaName });
    const registerResponse = await register({...registerData, areaCode: selectedAreaName});
    if (registerResponse.success) {
        showToastNotification("Registered!");
        if (onSuccess) onSuccess();
    }
    else {
        showToastNotification(registerResponse.message);
    }
}

export async function getAreas(): Promise<GeoJSON.FeatureCollection> {
    const res = await fetch(`${BACKEND_URL}/all-councils`);
    const councils = await res.json();
    
    const features: GeoJSON.Feature[] = councils.map((council: any, index: number) => {
        // Ensure the polygon is closed (first and last points are the same)
        const coordinates = [...council.lon_lat_points];
        
        return {
            type: "Feature",
            id: index + 1,  // or use council.gss_code if you prefer
            properties: {
                name: council.name,
                gss_code: council.gss_code
            },
            geometry: {
                type: "Polygon",
                coordinates: [coordinates]  // Note the extra array wrap for Polygon type
            }
        };
    });
    
    return {
        type: "FeatureCollection",
        features: features
    };
}

export const handleInputChange = (newVal: string, setSelectedAreaCode: React.Dispatch<React.SetStateAction<string>>) => {
    if (!/^[A-Z0-9]*$/.test(newVal)) {
        return;
    }
    setSelectedAreaCode(newVal);
}

export const handleMapPress = (pos: Point2D, areas: GeoJSON.FeatureCollection, setSelectedAreaCode: React.Dispatch<React.SetStateAction<string>>) => {
    const pressedArea = findContainingArea(pos, areas);
    const selectedAreaCode = pressedArea?.properties?.gss_code || "";
    setSelectedAreaCode(selectedAreaCode);
};
