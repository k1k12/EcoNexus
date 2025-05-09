import React, { useContext } from "react";
import { useToastNotification } from "@/components/core/ToastNotification";
import { createContext, ReactNode, useState } from "react";
import WarningOverlay from "@/components/councilAreaMap/WarningOverlay";

/**
 * PageContext Component
 *
 * This component provides a context for managing page-level functionalities such as displaying warning overlays and toast notifications.
 * It allows components to easily trigger these UI elements without needing to manage their state directly.
 *
 * Key Features:
 *   - Manages the state and display of a warning overlay.
 *   - Manages the display of toast notifications.
 *   - Provides functions for showing the warning overlay with customizable text and buttons.
 *   - Provides a function for showing toast notifications with customizable text and duration.
 *   - Wraps button onClick functions to automatically close the overlay.
 *
 * Functionality:
 *   - showOverlay: Sets the text and buttons for the warning overlay and displays it.
 *     - Wraps each button's onClick function to also close the overlay when the button is pressed.
 *   - showToastNotification: Displays a toast notification with the given text and duration.
 *
 * Context Value:
 *   - showOverlay: A function for showing the warning overlay.
 *   - showToastNotification: A function for showing toast notifications.
 *
 * Components:
 *   - WarningOverlay: A component that displays a full-screen warning overlay with customizable text and buttons.
 *   - ToastComponent: A component that displays toast notifications.
 *
 * Hooks:
 *   - useState: Used to manage the state of the warning overlay (text, buttons, and visibility).
 *   - useToastNotification: Used to manage the display of toast notifications.
 *   - useContext: Used to access the PageContext from other components.
 */

type PageContextType = {
    showOverlay: (text: string | string[], buttons?: React.JSX.Element[]) => void;
    showToastNotification: (text: string, duration?: number) => void;
};

const PageContext = createContext<PageContextType | null>(null);

const PageContextProvider = ({children} : {children: ReactNode}) => {
    const [overlayButtons, setOverlayButtons] = useState<React.JSX.Element[]>([]);

    const [warningOverlayText, setWarningOverlayText] = useState<string | string[]>("");
    const [displayOverlay, setDisplayOverlay] = useState<boolean>(false);
    const { ToastComponent, showToastNotification } = useToastNotification();

    const showOverlay = (text: string | string[], buttons?: React.JSX.Element[]) : void => {
        setWarningOverlayText(text);
        
        if (buttons) {
            // wrap each button's onClick to add overlay closing functionality
            const wrappedButtons = React.Children.map(buttons, (button) => {
                if (React.isValidElement(button)) {
                    const originalOnClick = button.props.onClick;
                    
                    return React.cloneElement(button, {
                        onClick: () => {
                            originalOnClick?.(); // call the original onClick
                            setDisplayOverlay(false); // close the overlay
                        }
                    });
                }
                return button;
            });
            console.log(wrappedButtons);
            setOverlayButtons(wrappedButtons);
        }
        else {
            setOverlayButtons([]); 
        }
        setDisplayOverlay(true);
    }

    return (
        <PageContext.Provider value={{showOverlay, showToastNotification}}>
            {displayOverlay && <WarningOverlay buttons={overlayButtons} hideOverlay={() => setDisplayOverlay(false)} text={warningOverlayText}/>}
            <ToastComponent />
            {children}
        </PageContext.Provider>
    )
}

export default PageContextProvider;

export const usePage = () => {
    const context = useContext(PageContext);
    if (!context) {
        throw new Error("usePage must be used withing PageContext.");
    }
    return context;
};
