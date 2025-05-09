import { PointsStatesHistory, HistoryAction } from "./_types";
import React, { useState, createContext, useContext, useEffect, ReactNode, useReducer } from "react";
import pointsStatesHistoryReducer from "./PointsStatesHistoryReducer";
import { Material, RecyclingPoint } from "@/types/types";
import { BACKEND_URL } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { latLonToLonLat } from "@/utils/mapUtils";
import { convertRecyclingPointFromBackend } from "@/utils/recyclingPointUtils";

/**
 * CouncilMapContext Component
 *
 * This component provides a context for managing the state of the Council Map, including recycling points, area shape, and materials.
 * It uses a reducer to manage the history of recycling point states, allowing for undo/redo functionality.
 *
 * Key Features:
 *   - Manages the state of recycling points, area shape, and materials.
 *   - Uses a reducer to manage the history of recycling point states.
 *   - Provides functions for dispatching actions to the reducer and accessing the current state.
 *   - Fetches council data, including recycling points, materials, and area shape, from the backend.
 *   - Converts recycling points from the backend format to the frontend format.
 *   - Provides a function for getting the current state of a recycling point.
 *   - Uses the AuthContext to get the user's GSS code for fetching council data.
 *
 * Functionality:
 *   - Fetches council data, including recycling points, materials, and area shape, from the backend.
 *   - Converts recycling points from the backend format to the frontend format.
 *   - Manages the state of recycling points, area shape, and materials using the useState and useReducer hooks.
 *   - Provides functions for dispatching actions to the reducer and accessing the current state.
 *   - Provides a function for getting the current state of a recycling point.
 *
 * Context Value:
 *   - pointsStatesHistory: The history of recycling point states, managed by the pointsStatesHistoryReducer.
 *   - dispatchPointsStatesHistory: A function for dispatching actions to the pointsStatesHistoryReducer.
 *   - areaShape: The shape of the council area, represented as an array of coordinates.
 *   - materials: A list of available materials for recycling points.
 *   - selectedPointId: The ID of the currently selected recycling point.
 *   - setSelectedPointId: A function for setting the ID of the currently selected recycling point.
 *   - getPointState: A function for getting the current state of a recycling point.
 *
 * Hooks:
 *   - useReducer: Used to manage the history of recycling point states.
 *   - useState: Used to manage the selected point ID, area shape, and materials.
 *   - useEffect: Used to fetch council data from the backend.
 *   - useAuth: Used to get the user's GSS code for fetching council data.
 */

type CouncilMapContextType = {
    pointsStatesHistory: PointsStatesHistory;
    dispatchPointsStatesHistory: React.Dispatch<HistoryAction>;
    areaShape: number[][];
    materials: Material[];
    selectedPointId: number | null;
    getPointState: (pointId: number) => RecyclingPoint
    setSelectedPointId: React.Dispatch<React.SetStateAction<number | null>>;
}

const CouncilMapContext = createContext<CouncilMapContextType | null>(null);

const CouncilMapContextProvider = ({children, onLoaded} : {children: ReactNode, onLoaded: () => void}) => {
    const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
    const [pointsStatesHistory, dispatchPointsStatesHistory] = useReducer(pointsStatesHistoryReducer, {} as PointsStatesHistory);
    const [areaShape, setAreaShape] = useState<number[][]>([]);
    const [recyclingPointsTypesList, setRecyclingPointsTypesList] = useState<Material[]>([]);
    const { userData } = useAuth();
    
    // since api call is async it needs to be called in useEffect
    useEffect(() => {
        const fetchCouncilData = async () => {
            if (!userData?.gssCode) throw new Error("Trying to fetch council data but gss code is not set for this user");
            try {
                const fetchRecyclingPointsUrl = `${BACKEND_URL}/recycling-points?gss_code=${userData.gssCode}`
                const fetchMaterialsUrl = `${BACKEND_URL}/materials`
                const fetchAreasUrl = `${BACKEND_URL}/all-councils`

                const responseRecyclingPoints = await fetch(fetchRecyclingPointsUrl);
                const responseMaterials = await fetch(fetchMaterialsUrl);
                const responseAreas = await fetch(fetchAreasUrl);

                if (!responseRecyclingPoints.ok || !responseMaterials.ok || !responseAreas.ok) {
                    throw new Error(`HTTP error!`);
                }
                const recyclingPoints = await responseRecyclingPoints.json();
                const materialsList = await responseMaterials.json();

                recyclingPoints.forEach((point: any) => {
                    dispatchPointsStatesHistory({type: "ADD_EXISTING", 
                                                value: convertRecyclingPointFromBackend(point, materialsList)
                    });
                });

                //contains a key "materials" under which there's a list of materials
                setRecyclingPointsTypesList(materialsList.map((m: any) => {
                    return {
                        id: m.material_id,
                        name: m.name
                    }
                })); 
                const allAreas: {gss_code: string, name: string, lon_lat_points: number[][]}[] = await responseAreas.json();
                const thisArea = allAreas.find(area => area.gss_code === userData.gssCode);
                if (!thisArea) throw new Error("Area with council's gss code doesn't exist.");
                setAreaShape(latLonToLonLat(thisArea.lon_lat_points));
                onLoaded();
            } catch (error) {
                console.error('Failed to fetch data:', error);
                throw error; // Re-throw if you want calling code to handle it
            }            
        };
        fetchCouncilData();
    }, []);

    const getPointState = (pointId: number) : RecyclingPoint => {
        const presentIndex = pointsStatesHistory[pointId].presentIndex;
        return pointsStatesHistory[pointId].states[presentIndex];
    }

    return <CouncilMapContext.Provider 
            value={{pointsStatesHistory, dispatchPointsStatesHistory, areaShape, materials: recyclingPointsTypesList, selectedPointId, setSelectedPointId, getPointState}}
           >
                {children}
           </CouncilMapContext.Provider>
}

export default CouncilMapContextProvider;

export const useCouncilMapContext = () => {
    const context = useContext(CouncilMapContext);
    if (!context) {
        throw Error("useCouncilMapContext must be used withing the corresponding provider.");
    }
    return context;
};
