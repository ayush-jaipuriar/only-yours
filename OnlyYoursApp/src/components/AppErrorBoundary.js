import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * AppErrorBoundary — catches unhandled JavaScript errors in the React component tree.
 *
 * Concept — Error Boundaries:
 * React's default behavior for an unhandled error is to unmount the entire component
 * tree, leaving the user with a blank screen. Error boundaries are special class
 * components that use two lifecycle methods to intercept errors:
 *
 * - static getDerivedStateFromError(error): Called during the render phase.
 *   Returns new state to trigger a re-render with the fallback UI.
 *
 * - componentDidCatch(error, info): Called after the error is committed.
 *   Used for logging the error to a crash reporting service (e.g., Sentry).
 *
 * WHY a class component? Error boundaries MUST be class components.
 * React hooks (functional components) cannot implement getDerivedStateFromError.
 * This is one of the few remaining use cases for class components in modern React.
 *
 * Usage: Wrap the entire app (or a subtree) in <AppErrorBoundary>.
 * The fallback UI gives the user a way to recover without restarting the app.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred',
    };
  }

  componentDidCatch(error, info) {
    // In production: send to Sentry, Firebase Crashlytics, etc.
    console.error('[AppErrorBoundary] Uncaught error:', error);
    console.error('[AppErrorBoundary] Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <Text style={styles.icon}>💔</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app ran into an unexpected problem. Your progress may not be saved.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppErrorBoundary;
