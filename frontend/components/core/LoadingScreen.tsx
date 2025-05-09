import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * LoadingScreen Component
 *
 * This component renders a full-screen loading overlay with a centered activity indicator.
 * It is used to indicate that the application is currently loading data or performing a task.
 *
 * Key Features:
 *   - Full-screen overlay with a semi-transparent background.
 *   - Centered activity indicator for visual feedback.
 *   - High z-index to ensure it appears on top of other content.
 *   - Backdrop filter for a blurred background effect.
 *
 * Functionality:
 *   - Renders a View with a semi-transparent background that covers the entire screen.
 *   - Renders an ActivityIndicator in the center of the screen to indicate loading.
 */

const LoadingScreen = () => {

  return (
    <View style={[styles.container]}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    height: "100%",
    width: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(2px)'
  },
  loaderContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  }
});

export default LoadingScreen;
