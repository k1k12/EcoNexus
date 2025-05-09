import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

/**
 * CustomButton Component
 *
 * This component renders a customizable button with theming support.
 * It utilizes the ThemeContext to adapt its appearance to the current theme.
 *
 * Key Features:
 *   - Customizable appearance through style and textStyle props.
 *   - Theming support via the ThemeContext.
 *   - Touchable opacity for visual feedback on press.
 *
 * Functionality:
 *   - Renders a TouchableOpacity with a Text component inside.
 *   - Applies styles from the StyleSheet and the style and textStyle props.
 *   - Calls the onPress function when the button is pressed.
 *
 * Props:
 *   - title: The text to display on the button.
 *   - onPress: A function to call when the button is pressed.
 *   - style: Optional styling for the button container.
 *   - textStyle: Optional styling for the button text.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  style, 
  textStyle 
}) => {
  const { theme } = useThemeContext();
  
  const styles = StyleSheet.create({
    button: {
      width: 104,
      height: 34,
      backgroundColor: theme.bg_secondary,
      borderWidth: 1,
      borderColor: theme.secondary, 
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    buttonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
