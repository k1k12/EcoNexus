import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * useKeyboardVisible Hook
 *
 * This hook provides a boolean value indicating whether the keyboard is currently visible.
 * It uses the React Native Keyboard API to listen for keyboard show and hide events.
 *
 * Key Features:
 *   - Detects keyboard visibility changes on iOS and Android platforms.
 *   - Returns a boolean value indicating whether the keyboard is currently visible.
 *   - Does nothing on web platforms.
 *
 * Functionality:
 *   - Adds listeners for the keyboardDidShow and keyboardDidHide events.
 *   - Updates the keyboardVisible state when the keyboard is shown or hidden.
 *   - Removes the listeners when the component unmounts.
 *
 * Returns:
 *   - A boolean value indicating whether the keyboard is currently visible.
 *
 * Dependencies:
 *   - react-native: Used for accessing the Keyboard API.
 */

export function useKeyboardVisible(): boolean {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardVisible;
}
