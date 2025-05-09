import CouncilMap from "@/components/councilAreaMap/CouncilMap";

import CouncilMapContextProvider from "@/components/councilAreaMap/CouncilMapContext";
import LeafletContextProvider from "@/context/LeafletContext";
import { useState } from "react";
import LoadingScreen from "@/components/core/LoadingScreen";
import { withAuth } from "@/utils/withAuth";

/**
 * CouncilAreaMapPage (Web-Specific) Component
 *
 * This component is the web-specific implementation for displaying a map of council areas, intended for council users.
 * It leverages Leaflet for rendering the map and restricts access to council users only.
 *
 * Key Features:
 *   - Web-specific implementation using Leaflet for map rendering.
 *   - Utilizes CouncilMapContextProvider to manage the map's state and data.
 *   - Uses LeafletContextProvider to provide Leaflet context to the map components.
 *   - Implements a loading screen to display while the map is loading.
 *   - Restricts access to council users only using the withAuth higher-order component.
 *
 * Functionality:
 *   - The component renders a CouncilMap component within a CouncilMapContextProvider and LeafletContextProvider.
 *   - It displays a loading screen until the map is fully loaded.
 *   - It uses withAuth to ensure that only users with the "COUNCIL" role can access the page.
 */

const CouncilAreaMapPage = () => {
    const [loaded, setLoaded] = useState<boolean>(false);
    
    return <LeafletContextProvider>
           <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "row", gap: 10, justifyContent: "center"}}>
               <CouncilMapContextProvider onLoaded={() => setLoaded(true)}>
               {loaded ?
                   <CouncilMap/>
                :
                    <LoadingScreen />
               }
               </CouncilMapContextProvider>
           </div>
           </LeafletContextProvider>
}

export default withAuth(CouncilAreaMapPage, ["COUNCIL"]);
