import { useThemeContext } from '@/context/ThemeContext';
import { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming }from "react-native-reanimated"

/**
 * DropDownMultiSelect Component
 *
 * This component renders a multi-select dropdown list with animated opening and closing.
 * It allows users to select multiple options from a predefined list.
 *
 * Key Features:
 *   - Animated dropdown opening and closing using react-native-reanimated.
 *   - Multi-select functionality, allowing users to select multiple options.
 *   - Customizable appearance through theming via the ThemeContext.
 *   - Uses a FlatList for efficient rendering of the dropdown options.
 *
 * Functionality:
 *   - Toggles the dropdown visibility with an animated effect.
 *   - Updates the selected options based on user interaction.
 *   - Calls the onChange callback function with the updated selection.
 *
 * Props:
 *   - currentSelection: An array of strings representing the currently selected options.
 *   - options: An array of strings representing the available options in the dropdown.
 *   - onChange: A callback function that is called when the selection changes.
 *
 * Dependencies:
 *   - react-native-reanimated: Used for creating the animated dropdown effect.
 *   - ThemeContext: Used for theming the component.
 */

interface DropDownMultiSelectProps {
  currentSelection: string[];
  options: string[];
  onChange: (selected: string[]) => void;
}

const DropDownMultiSelect = ({ currentSelection, options, onChange }: DropDownMultiSelectProps) => {
  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);
  const { theme } = useThemeContext();

  const scale = useSharedValue(0);

  const toggleDropdown = () => {
      if (!isDropdownOpened) {
          scale.value = withTiming(1, { duration: 300 });
      }
      else {
          scale.value = withTiming(0, { duration: 300 });
      }
      setIsDropdownOpened(!isDropdownOpened);
  }

  const animatedStyle = useAnimatedStyle(() => ({
      transform: [
          {scaleY: scale.value}
      ],
      transformOrigin: "top"
  }));

  return (
    <View style={{margin: 10, position: "relative", flex: 1}}>
      <Pressable
        onPress={toggleDropdown}
        style={{
            padding: 10,
            borderWidth: 1,
            borderColor: theme.secondary,
            borderBottomStartRadius: isDropdownOpened ? 0 : 5,
            borderBottomEndRadius: isDropdownOpened ? 0 : 5,
            borderRadius: 5,
            backgroundColor: theme.bg_secondary,
            userSelect: "none",
        }}
      >
        <Text style={{color: theme.text}}>{currentSelection.length ? currentSelection.join(', ') : 'Select options'}</Text>
      </Pressable>
        <Animated.View 
        style={[{
            width: "100%", 
            borderWidth: 1,
            borderRadius: 5,
            borderTopWidth: 0,
            borderTopStartRadius: 0,
            borderTopEndRadius: 0,
            borderColor: theme.secondary,
            overflow: "hidden",
            position: "absolute",
            top: "100%",
            maxHeight: 300,
            zIndex: 99999999999
        }, animatedStyle]}
        >
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            scrollEnabled
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  const newSelection = currentSelection.includes(item)
                    ? currentSelection.filter((s) => s !== item)
                    : [...currentSelection, item];
                  onChange(newSelection);
                }}
                style={{
                    padding: 10,
                    backgroundColor: currentSelection.includes(item) ? theme.secondary : theme.bg_secondary,
                    userSelect: "none",
                    zIndex: 999999999999,
                }}
              >
                <Text style={{color: theme.text}}>{item}</Text>
              </Pressable>
            )}
          />
        </Animated.View>
    </View>
  );
};

export default DropDownMultiSelect;
