import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';

const ErrorModal = ({ visible, source, message, onClose }) => {
  const [lineWidth, setLineWidth] = useState(new Animated.Value(0)); // Animated value for the red progress bar

  useEffect(() => {
    if (visible) {
      // Start the progress bar animation when the modal becomes visible
      Animated.timing(lineWidth, {
        toValue: 1, // Progress bar will go from 0 to 1 (100% width)
        duration: 3000, // Duration for the progress bar to fill in 3 seconds
        useNativeDriver: false, // Need to use false for width changes
      }).start();

      // Automatically close the modal after 3 seconds if not manually closed
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer); // Clear timer on unmount or when modal is closed
    } else {
      setLineWidth(new Animated.Value(0)); // Reset progress bar width if modal is closed
    }
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-start items-center bg-slate-800 opacity-90">
          {/* Progress bar at the top */}
          <Animated.View
            className="absolute top-0 left-0 h-1 bg-red-600"
            style={{
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'], // Animate from 0% to 100%
              }),
            }}
          />
          {/* Main modal content */}
          <View className="flex-1 items-center w-full">
            <View className="p-6 bg-slate-100 border-l-8 border-s-red-500 rounded-lg w-96 mt-4">
                <Text className="text-center text-xl font-bold text-gray-800">{source} Error</Text>
                <Text className="text-center text-md font-semibold text-red-500">{message}</Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ErrorModal;
