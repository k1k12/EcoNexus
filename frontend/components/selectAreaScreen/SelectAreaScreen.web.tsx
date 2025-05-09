import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import { usePage } from "@/context/PageContext";
import { getCouncilAreas } from "@/utils/apiCalls";
import ArrowIcon from "@/assets/icons/arrow";
import { useLeaflet } from "@/context/LeafletContext";
import LoadingScreen from "../core/LoadingScreen";
import { RegisterFields } from "@/types/types";
import { handleInputChange, handleProceed, handleMapPress, getAreas} from "./shared";
import { useAuth } from "@/context/AuthContext";
import { LoginPages } from "@/types/types"

/**
 * SelectAreaScreen Component (Web)
 *
 * This component allows users to select their council area on a map during the registration process on the web platform.
 * It displays a Leaflet map with highlighted council areas and provides options to select an area either by
 * tapping on the map or by entering the GSS code manually.
 *
 * Key Features:
 *   - Displays a Leaflet map with council areas.
 *   - Allows users to select an area by tapping on the map.
 *   - Provides a text input for users to manually enter the GSS code of their area.
 *   - Fetches council area data from the backend and displays it on the map.
 *   - Highlights the selected area on the map.
 *   - Provides navigation buttons to go back to the previous registration step or proceed to the next step.
 *   - Integrates with the AuthContext for user registration.
 *   - Uses the ThemeContext for styling.
 *   - Uses the PageContext for displaying toast notifications.
 *   - Uses LeafletContext to access Leaflet-related functionalities.
 *
 * Functionality:
 *   - Fetches council area data from the backend using the getAreas function.
 *   - Displays the council areas on the map as polygons.
 *   - Allows users to select an area by tapping on the map, highlighting the selected area.
 *   - Allows users to manually enter the GSS code of their area in a text input.
 *   - Validates the entered GSS code against the available council areas.
 *   - Registers the user with the selected council area using the register function from the AuthContext.
 *   - Displays toast notifications to inform the user about the status of the registration process.
 *   - Navigates the user to the next registration step upon successful registration.
 *   - Uses shared functions from "./shared.ts" to handle input changes, map presses, and proceeding to the next step.
 *
 * Props:
 *   - registerData: An object containing the user's registration data.
 *   - setRegisterData: A function to update the user's registration data.
 *   - setPage: A function to navigate to a different registration page.
 *
 * Components:
 *   - reactLeaflet.MapContainer: A Leaflet component that renders the map.
 *   - reactLeaflet.TileLayer: A Leaflet component that renders the map tiles.
 *   - reactLeaflet.Polygon: A Leaflet component that renders the council areas as polygons.
 *   - LoadingScreen: A component that displays a loading indicator while the council area data is being fetched.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAuth: Provides access to the authentication functions and data.
 *   - useLeaflet: Provides access to Leaflet-related functionalities.
 */

const SelectAreaScreen = ({registerData, setRegisterData, setPage} : 
                          {registerData: RegisterFields, 
                          setRegisterData: React.Dispatch<React.SetStateAction<RegisterFields>>,
                          setPage: React.Dispatch<React.SetStateAction<LoginPages>>}
) => {
    const { theme } = useThemeContext();
    const [areas, setAreas] = useState<GeoJSON.FeatureCollection | null>(null);
    
    const [selectedAreaCode, setSelectedAreaCode] = useState<string>("");
    const { showToastNotification } = usePage();

    const { register } = useAuth();

    const polygonRefs = useRef<Record<string, L.Polygon>>({});
    
    const { leaflet, reactLeaflet } = useLeaflet();

    useEffect(() => {
        if (!areas) return;
        areas.features.forEach(f => {
            const code = f.properties.gss_code;
            const ref = polygonRefs.current[code];
            if (ref) {
                ref.setStyle({
                    color: selectedAreaCode === code ? "green" : "blue"
                });
            }
        });
    }, [selectedAreaCode]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getAreas();
            setAreas(data);
        };
        fetchData();
    }, []);

    if (!leaflet || !reactLeaflet || !areas) return <LoadingScreen />;

    return (
        <View style={{ 
            flex: 1,
            width: "100%",
            height: "100%",
            justifyContent: "center"
        }}>
            <Text style={{ fontSize: 16, textAlign: "center", fontWeight: "bold", color: theme.text }}>
            Select your area
            </Text>
            <View
            style={{
                flex: 1,
                position: "relative",
                justifyContent: "center",
                alignItems: "center",
                margin: 10,
                borderRadius: 10,
                overflow: "hidden"
            }}>
                <reactLeaflet.MapContainer
                style={{flex: 1, height: "100%", width: "100%"}}
                center={[53.505, -0.09]}
                zoom={6}
                >
                    <reactLeaflet.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {areas.features.map((f) => (
                        <reactLeaflet.Polygon
                          key={f.id}
                          ref={(ref) => {
                            if (ref) polygonRefs.current[f.properties.gss_code] = ref;
                          }}
                          positions={f.geometry?.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng])}
                          pathOptions={{
                            color: selectedAreaCode === f.properties.gss_code ? "green" : "blue",
                            fillOpacity: 0.2
                          }}
                          eventHandlers={{
                            click: (e: any) => {
                              const latlng = e.latlng;
                              handleMapPress({ x: latlng.lng, y: latlng.lat }, areas, setSelectedAreaCode);
                            }
                          }}
                        />
                    ))}
                </reactLeaflet.MapContainer>
                    <View
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        position: "absolute",
                        paddingHorizontal: 5,
                        gap: 5,
                        width: "30%",
                        height: 30,
                        bottom: 10,
                        zIndex: 9999
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
                            alignItems: "center",
                            minWidth: 28,
                            minHeight: 28,
                        }}
                        onPress={() => {setPage(LoginPages.CreateAccountPage)}}
                        >
                            <Text style={{color: theme.text, fontWeight: "bold"}}>Back</Text>
                        </Pressable>
                        <TextInput
                        value={selectedAreaCode}
                        placeholder="Or enter GSS code manually"
                        placeholderTextColor={theme.text}
                        inputMode="text"
                        autoCapitalize="characters"
                        onChangeText={(newVal: string) => handleInputChange(newVal, setSelectedAreaCode)}
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
                            alignItems: "center",
                            minWidth: 28,
                            minHeight: 28
                        }}
                        onPress={() => handleProceed(registerData, setRegisterData, register, 
                                                     areas, showToastNotification, selectedAreaCode, 
                                                     () => {setPage(LoginPages.PendingApproval)}
                        )}
                        >
                            <ArrowIcon width={24} height={24} stroke={theme.primary}/>
                        </Pressable>
                    </View>
            </View>
        </View>
    );
};

export default SelectAreaScreen;
