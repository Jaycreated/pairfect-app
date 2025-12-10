import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { PoppinsText } from '../components/PoppinsText';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  duration?: number;
  style?: ViewStyle;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top',
  duration = 3000,
  style,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastType = 'info', customDuration = duration) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ message, type });

    // Fade in animation
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: position === 'top' ? 0 : 20,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, customDuration) as unknown as ReturnType<typeof setTimeout>;
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const getBackgroundColor = (type: ToastType) => {
    // Using #651B55 for all toast types as requested
    return '#651B55';
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
              top: position === 'top' ? 50 : undefined,
              bottom: position === 'bottom' ? 50 : undefined,
              backgroundColor: getBackgroundColor(toast.type),
              ...style,
            },
          ]}
        >
          <PoppinsText style={styles.text}>{toast.message}</PoppinsText>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
});

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
