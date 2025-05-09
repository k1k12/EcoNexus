import { useThemeContext } from "@/context/ThemeContext";
import { ReactNode, useState } from "react";
import { Pressable, Text, ViewStyle } from "react-native";

/**
 * HoverButton Component
 *
 * This component renders a button that changes its appearance on hover.
 * It utilizes the ThemeContext to adapt its appearance to the current theme.
 *
 * Key Features:
 *   - Customizable appearance through style, hoveredColor, and notHoveredColor props.
 *   - Theming support via the ThemeContext.
 *   - Hover effect using Pressable and useState.
 *   - Optional active state with opacity and pointerEvents control.
 *
 * Functionality:
 *   - Renders a Pressable with a Text component inside.
 *   - Applies styles from the style prop and internal styling.
 *   - Changes background color on hover.
 *   - Calls the onClick function when the button is pressed.
 *   - Disables the button and reduces opacity when active is false.
 *
 * Props:
 *   - onClick: A function to call when the button is pressed.
 *   - children: The content to display on the button.
 *   - style: Optional styling for the button container.
 *   - hoveredColor: Optional color to use when the button is hovered.
 *   - notHoveredColor: Optional color to use when the button is not hovered.
 *   - active: Optional boolean to disable the button and reduce opacity.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

type HoverButtonStyle = ViewStyle & {
    textColor?: string;
};

interface HoverButtonProps {
    onClick: (() => void) | ((e: any) => void);
    children: ReactNode;
    hoveredColor?: string;
    notHoveredColor?: string;
    style?: HoverButtonStyle;
    active?: boolean;
}

const HoverButton = ({ onClick, children, style, hoveredColor, notHoveredColor, active} : HoverButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useThemeContext();
    
    const onHoverColor = hoveredColor ? hoveredColor : theme.bg_secondary;
    const regularColor = notHoveredColor ? notHoveredColor : theme.bg_primary;

    return (
        <Pressable
            style={{
                borderColor: theme.primary,
                borderRadius: 10,
                borderWidth: 1,
                padding: 5,
                ...style,
                backgroundColor: isHovered ? onHoverColor: regularColor,
                userSelect: "none",
                opacity: active !== undefined ? (active ? 1 : 0.5) : 1,
                pointerEvents: active !== undefined ? (active ? "auto" : "none") : "auto",
            }}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            onPress={() => {
                if (active === undefined) onClick();  
                else if (!active) return;
                else onClick();
            }}
        >
            <Text
              style={{
                color: style?.textColor ?? theme.text,
                textAlign: "center",
                paddingVertical: 4,
                fontSize: 14,
                fontWeight: "bold",
              }}
              numberOfLines={1}
            >
              {children}
            </Text>        
        </Pressable>
    );
};

export default HoverButton;
