import { useThemeContext } from "@/context/ThemeContext"
import HoverButton from "../core/HoverButton";

/**
 * WarningOverlay Component
 *
 * This component renders a full-screen warning overlay with customizable text and buttons.
 * It is used to display warning messages or prompts to the user, requiring them to take action before proceeding.
 *
 * Key Features:
 *   - Full-screen overlay with a semi-transparent background and blurred backdrop.
 *   - Customizable text content, supporting both single strings and arrays of strings.
 *   - Customizable buttons, allowing for multiple actions to be presented to the user.
 *   - Theming support via the ThemeContext.
 *   - High z-index to ensure it appears on top of other content.
 *
 * Functionality:
 *   - Renders a full-screen overlay with a semi-transparent background and blurred backdrop.
 *   - Displays the provided text content, either as a single paragraph or as multiple paragraphs.
 *   - Renders the provided buttons, allowing the user to take action.
 *   - If no buttons are provided, renders a default "Confirm" button that calls the hideOverlay function.
 *   - Uses CSS styling for layout and appearance.
 *
 * Props:
 *   - text: The text to display in the warning overlay. Can be a single string or an array of strings.
 *   - buttons: An optional array of React JSX elements to display as buttons in the overlay.
 *   - hideOverlay: A function to call when the overlay should be hidden.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const WarningOverlay = ({text, buttons, hideOverlay} : {
    hideOverlay: () => void;
    buttons?: React.JSX.Element[];
    text: string | string[]
}) => {
    const { theme } = useThemeContext();

    const isTextArray = Array.isArray(text);

    return (
        <div style={{
            display: "flex",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 999999999,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)"}}
            >
            <div style={{
                color: theme.text, 
                display: "flex",
                height: "auto",
                gap: 10,
                padding: 15,
                flexDirection: "column",
                background: theme.bg_secondary,
                border: "1px solid grey",
                borderRadius: "5px",
                justifyContent: "center",
                alignItems: "center"}}
            >
                {isTextArray ? (
                    text.map((txt, index) => {
                        return <p key={index} style={{ margin: 0, textAlign: 'center' }}>
                                {txt}
                               </p>
                    })
                ) : (
                    <p style={{ textAlign: "center" }}>
                        {text}
                    </p>
                )}                
                {!buttons || buttons.length < 1 && ( 
                <HoverButton onClick={hideOverlay} style={{
                    borderWidth: 1,
                    borderColor: theme.tertiary,
                    borderRadius: 5,
                    padding: 5}}
                    hoveredColor={theme.secondary}
                    >
                    Confirm
                    </HoverButton>
                )}
                {buttons && buttons.length > 1 && (
                <div style={{display: "flex", gap: 5, flexDirection: "row", justifyContent: "center"}}>
                    {buttons}
                </div>
                )}
            </div>
        </div>
    );
}

export default WarningOverlay;
