import { useContext, useState, createContext, ReactNode, useEffect } from "react";
import { Text, View } from "react-native";

import "leaflet/dist/leaflet.css";
import { useThemeContext } from "./ThemeContext";
import { binIconHTML, incompleteBinIconHTML, selectedBinIconHTML } from "@/assets/icons/bin";
import LoadingScreen from "@/components/core/LoadingScreen";

/**
 * LeafletContext Component
 *
 * This component provides a context for managing Leaflet-related functionalities throughout the application.
 * It dynamically imports Leaflet and react-leaflet to prevent Metro bundler crashes and provides access
 * to Leaflet modules and custom icons.
 *
 * Key Features:
 *   - Dynamically imports Leaflet and react-leaflet to prevent Metro bundler crashes.
 *   - Provides access to Leaflet modules and custom icons through the context.
 *   - Applies theme-based styling to Leaflet popups.
 *   - Initializes custom icons for recycling points.
 *   - Prevents rendering children until the Leaflet libraries are loaded.
 *
 * Functionality:
 *   - Dynamically imports Leaflet and react-leaflet using the import() function.
 *   - Creates custom icons for recycling points using Leaflet's DivIcon class.
 *   - Applies theme-based styling to Leaflet popups by injecting CSS into the document head.
 *   - Provides access to Leaflet modules and custom icons through the context value.
 *   - Uses a loading screen while the Leaflet libraries are being loaded.
 *
 * Context Value:
 *   - reactLeaflet: The react-leaflet module.
 *   - leaflet: The Leaflet module.
 *   - binIcon: The custom icon for recycling points.
 *   - selectedBinIcon: The custom icon for selected recycling points.
 *   - incompleteBinIcon: The custom icon for incomplete recycling points.
 *
 * Hooks:
 *   - useState: Used to manage the state of the Leaflet modules and custom icons.
 *   - useEffect: Used to dynamically import Leaflet and react-leaflet, apply theme-based styling to popups, and initialize custom icons.
 *   - useContext: Used to access the ThemeContext and LeafletContext from other components.
 *
 * Dependencies:
 *   - leaflet: The Leaflet mapping library.
 *   - react-leaflet: The React bindings for Leaflet.
 *   - ThemeContext: Used to access the application's theme for styling.
 *   - LoadingScreen: Used to display a loading indicator while the Leaflet libraries are being loaded.
 */

// This context provider here is to prevent Metro (bundler) from crashing.
// Metro, the bundler, executes top level code of all imported libraries while resolving the imports.
// If a module uses "import react-leaflet" Metro imports react-leaflet, which in turn imports bare leaflet.js.
// So Metro executes not only react-leaflet top-level code, but also the one from the leaflet.js.
// The leaflet.js was designed in a way which assumes you're going to execute it only in a browser and it's 
// top-level code relies on this assumption heavily (it refers to the .window (js browser api)).
// But at the build time the code is going to be executed not in a browser, but in the Metro build environment,
// so the .window is not going to be accessible there, leading to a crash.
// --------------------------
// Solution: dynamic imports. Here, the react-leaflet and the leaflet.js are imported dynamically, meaning only when this code 
// is run within a browser. It's being done in a context provider to make sure that leaflet is imported only once for the entire 
// time of when this provider is mounted. And to reduce duplication. Otherwise, this code would have to be written in every component which
// uses react-leaflet, but this way they simply call the useLeaflet hook.
// --------------------------
// NOTE: Any component which uses react-leaflet must be wrapped in this provider and then in that component use "useLeaflet" hook to get the leaflet modules.

interface LeafletContextType {
    reactLeaflet: any;
    leaflet: any;
    binIcon: any;
    selectedBinIcon: any;
    incompleteBinIcon: any;
}

const LeafletContext = createContext<LeafletContextType | null>(null);

const LeafletContextProvider = ({ children }: { children: ReactNode }) => {
    const [reactLeaflet, setReactLeaflet] = useState<any>(null);
    const [leaflet, setLeaflet] = useState<any>(null);
    const [binIcon, setBinIcon] = useState<any>(null);
    const [selectedBinIcon, setSelectedBinIcon] = useState<any>(null);
    const [incompleteBinIcon, setIncompleteBinIcon] = useState<any>(null);

    const { theme } = useThemeContext();

    useEffect(() => {
        const loadLeaflet = async () => {
            const rlf = await import("react-leaflet"); // ignore warning
            const lf = await import("leaflet"); // ignore warning
            setReactLeaflet(rlf);
            setLeaflet(lf.default);
        };
        loadLeaflet();
    }, []);

    // An ugly but the only way to change the color of popup so it matches selected theme
    useEffect(() => {
        let customPopupStyleElement = document.getElementById("leaflet-popup-custom-style");

        if (!customPopupStyleElement) {
            customPopupStyleElement = document.createElement("style");
            customPopupStyleElement.id = "leaflet-popup-custom-style";
            document.head.appendChild(customPopupStyleElement);
        }

        customPopupStyleElement.innerHTML = `
        .leaflet-popup-content-wrapper {
            background: ${theme.bg_secondary} !important;
            color: ${theme.text} !important;
            border-radius: 8px;
            padding: 1px;
        }
        .leaflet-popup-tip {
            background: ${theme.bg_secondary} !important;
        }
        `;

        return () => {
            if (customPopupStyleElement && document.head.contains(customPopupStyleElement)) {
                document.head.removeChild(customPopupStyleElement);
            }
        };    
    }, [theme]); // re-executes when theme changes

    // initialize custom icons
    useEffect(() => {
        if (!leaflet) return;
        const customBinIcon = new leaflet.DivIcon({
            html: binIconHTML,
            iconSize: [26, 30],
            iconAnchor: [13, 15],
            popupAnchor: [-1, -15],
        });

        const customSelectedBinIcon = new leaflet.DivIcon({
            html: selectedBinIconHTML,
            iconSize: [26, 30],
            iconAnchor: [13, 15],
            popupAnchor: [-1, -15],
        });

        const customIncompleteBinIcon = new leaflet.DivIcon({
            html: incompleteBinIconHTML,
            iconSize: [26, 30],
            iconAnchor: [13, 15],
            popupAnchor: [-1, -15],
        });

        setBinIcon(customBinIcon);
        setSelectedBinIcon(customSelectedBinIcon);
        setIncompleteBinIcon(customIncompleteBinIcon);

        // we need to manually adjust the style so that icons appear on a transparent background
        const style = document.createElement("style");
        style.innerHTML = `
            .leaflet-container {
                border: 1px solid grey !important;
            }
            .leaflet-div-icon {
                background: transparent !important;
                border: none !important;
            }
        `;
        document.head.appendChild(style);
        return () => {document.head.removeChild(style)};
    }, [leaflet]);

    // prevent rendering children until the libraries are loaded
    if (!reactLeaflet || !leaflet || !binIcon || !selectedBinIcon || !incompleteBinIcon) return <LoadingScreen />;

    return (
        <LeafletContext.Provider value={{ reactLeaflet, leaflet, binIcon, selectedBinIcon, incompleteBinIcon}}>
            {children}
        </LeafletContext.Provider>
    );
};

export default LeafletContextProvider;

export const useLeaflet = () => {
    const context = useContext(LeafletContext);
    if (!context) {
        throw new Error("useLeaflet must be used within a LeafletContextProvider");
    }
    return context;
};
