import React, { useEffect, useMemo, useState } from "react";
import { MapView, Camera, RasterSource, RasterLayer, ShapeSource, FillLayer, LineLayer } from "@maplibre/maplibre-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import { usePage } from "@/context/PageContext";
import { getCouncilAreas } from "@/utils/apiCalls";
import ArrowIcon from "@/assets/icons/arrow";
import { RegisterFields } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { getAreas, handleInputChange, handleMapPress, handleProceed } from "./shared";
import { LoginPages } from "@/types/types";
import LoadingScreen from "../core/LoadingScreen";

/**
 * SelectAreaScreen Component (Native)
 *
 * This component allows users to select their council area on a map during the registration process.
 * It displays a map with highlighted council areas and provides options to select an area either by
 * tapping on the map or by entering the GSS code manually.
 *
 * Key Features:
 *   - Displays a map with council areas using MapLibre React Native.
 *   - Allows users to select an area by tapping on the map.
 *   - Provides a text input for users to manually enter the GSS code of their area.
 *   - Fetches council area data from the backend and displays it on the map.
 *   - Highlights the selected area on the map.
 *   - Provides navigation buttons to go back to the previous registration step or proceed to the next step.
 *   - Integrates with the AuthContext for user registration.
 *   - Uses the ThemeContext for styling.
 *   - Uses the PageContext for displaying toast notifications.
 *
 * Functionality:
 *   - Fetches council area data from the backend using the getAreas function.
 *   - Displays the council areas on the map as fill and line layers.
 *   - Allows users to select an area by tapping on the map, highlighting the selected area.
 *   - Allows users to manually enter the GSS code of their area in a text input.
 *   - Validates the entered GSS code against the available council areas.
 *   - Registers the user with the selected council area using the register function from the AuthContext.
 *   - Displays toast notifications to inform the user about the status of the registration process.
 *   - Navigates the user to the next registration step upon successful registration.
 *
 * Props:
 *   - registerData: An object containing the user's registration data.
 *   - setRegisterData: A function to update the user's registration data.
 *   - setPage: A function to navigate to a different registration page.
 *
 * Components:
 *   - MapView: A component from MapLibre React Native that displays the map.
 *   - Camera: A component from MapLibre React Native that sets the initial map view.
 *   - RasterSource: A component from MapLibre React Native that provides raster tile data for the map.
 *   - RasterLayer: A component from MapLibre React Native that renders raster tile data on the map.
 *   - ShapeSource: A component from MapLibre React Native that provides vector data for the map.
 *   - FillLayer: A component from MapLibre React Native that renders filled polygons on the map.
 *   - LineLayer: A component from MapLibre React Native that renders lines on the map.
 *   - LoadingScreen: A component that displays a loading indicator while the council area data is being fetched.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAuth: Provides access to the authentication functions and data.
 */

const SelectAreaScreen = ({registerData, setRegisterData, setPage} : 
                          {registerData: RegisterFields, 
                          setRegisterData: React.Dispatch<React.SetStateAction<RegisterFields>>,
                          setPage: React.Dispatch<React.SetStateAction<LoginPages>>}
) => {
    const [selectedAreaName, setSelectedAreaName] = useState<string>("");
    const camera = useMemo(() => <Camera centerCoordinate={[-0.1276, 51.5072]}/>, []);
    const [areas, setAreas] = useState<GeoJSON.FeatureCollection | null>(null);

    useEffect(() => {
        const fetchAreas = async () => {
            const data = await getAreas();
            setAreas(data);
        };
        fetchAreas();
    }, []);

    if (!areas) return <LoadingScreen />;

    const { theme } = useThemeContext();
    const { register } = useAuth();
    const { showToastNotification } = usePage();

    return (
        <View style={{ 
            flex: 1,
            width: "100%",
            justifyContent: "center",
            height: "100%"
        }}>
            <Text style={{ fontSize: 16, textAlign: "center", fontWeight: "bold", color: theme.text }}>
            Select your area
            </Text>
            <View
            style={{
                flex: 1,
                position: "relative",
                justifyContent: "center",
                margin: 10
            }}>
                <MapView 
                style={{
                    flex: 1, 
                    height: "100%",
                    width: "100%",
                    borderRadius: 15, 
                    overflow: "hidden", 
                }}
                onPress={(f: GeoJSON.Feature) => handleMapPress({x: f.geometry.coordinates[0],
                                                                y: f.geometry.coordinates[1]},
                                                                areas, setSelectedAreaName)}
                >
                {camera}
                    <RasterSource
                    id="osm"
                    tileUrlTemplates={["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]}
                        tileSize={256}
                    >
                    <RasterLayer id="osmLayer" sourceID="osm" />
                    </RasterSource>

                    <ShapeSource 
                    id="areas" 
                    shape={areas} >
                        <FillLayer
                        id="areasFill"
                        sourceID="areas"
                        style={{
                            fillColor: [
                                "case",
                                ["==", ["get", "gss_code"], selectedAreaName || ""], // If ID matches selected
                                "green",
                                    "blue",
                            ],
                    fillOpacity: 0.2,
                        }}
                        />
                        <LineLayer
                        sourceID="areas"
                        id="areasLines"
                        style={{lineColor: "#3446eb"}}
                        />
                    </ShapeSource>
                </MapView>
                <View
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    position: "absolute",
                    paddingHorizontal: 5,
                    gap: 5,
                    width: "100%",
                    height: 30,
                    bottom: 10,
                    zIndex: 99,
                }}
                >
                    <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: theme.bg_secondary,
                        borderWidth: 1,
                        borderColor: theme.primary,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                    onPress={() => {setPage(LoginPages.CreateAccountPage)}}
                    >
                        <Text style={{color: theme.text, fontWeight: "bold"}}>Back</Text>
                    </Pressable>
                    <TextInput
                    value={selectedAreaName}
                    placeholder="Or enter GSS code manually"
                    placeholderTextColor={theme.text}
                    inputMode="text"
                    autoCapitalize="characters"
                    onChangeText={(newVal: string) => handleInputChange(newVal, setSelectedAreaName)}
                    style={{
                        flex: 4,
                        backgroundColor: theme.bg_secondary,
                        color: theme.text,
                        borderWidth: 1,
                        borderColor: theme.primary,
                        borderRadius: 10,
                        height: "100%",
                        alignSelf: "center",
                        textAlign: "center",
                    }}/>
                    <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: theme.bg_secondary,
                        borderWidth: 1,
                        borderColor: theme.primary,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                    onPress={() => handleProceed(registerData, setRegisterData, register, areas, 
                                                 showToastNotification, selectedAreaName, 
                                                () => {setPage(LoginPages.PendingApproval)})}
                    >
                        <ArrowIcon width={24} height={24} stroke={theme.primary}/>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default SelectAreaScreen;
