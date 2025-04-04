import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, Image } from 'react-native';

const LoadingScreen = () => {
  const text = "SmartYatra".split(""); // Split text into individual letters
  const animationValues = useRef(text.map(() => new Animated.Value(0))).current;
  const logoScale = useRef(new Animated.Value(0)).current; // Animation for the logo scaling

  useEffect(() => {
    // Step 1: Animate the logo to pop-up (scale from 0 to 1)
    const logoAnimation = Animated.timing(logoScale, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    // Step 2: Each letter fades in quickly one after another
    const fadeInAnimations = animationValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 200, // Faster fade-in
        delay: index * 80, // Quicker sequence
        useNativeDriver: true,
      })
    );

    // Step 3: After all letters appear, create a single wave from the center outward
    const waveAnimations = animationValues.map((anim, index) =>
      Animated.sequence([
        Animated.delay(500), // Short delay before the wave effect
        Animated.timing(anim, {
          toValue: 1.3, // Move up
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1, // Move back to normal
          duration: 250,
          useNativeDriver: true,
        }),
      ])
    );

    // Step 4: Trigger both the logo animation and text animation concurrently
    Animated.parallel([
      logoAnimation, // Logo animation starts immediately
      Animated.sequence([ // Text animations start simultaneously with the logo
        Animated.stagger(50, fadeInAnimations), // Step 1: Letters fade in one by one
        Animated.stagger(80, waveAnimations.reverse()), // Step 2: Wave effect
      ])
    ]).start();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      {/* Logo Animation */}
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require('../assets/logo.png')} // Make sure the path is correct
          style={{ width: 150, height: 150 }}
        />
      </Animated.View>

      {/* Text Animation */}
      <View className="flex-row">
        {text.map((char, index) => {
          const centerIndex = Math.floor(text.length / 2); // Find center letter
          const distanceFromCenter = Math.abs(centerIndex - index); // Distance from center for wave effect

          return (
            <Animated.Text
              key={index}
              style={{
                opacity: animationValues[index], // Fades in after previous letter
                transform: [
                  {
                    translateY: animationValues[index].interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [0, -10 * (1 - distanceFromCenter / centerIndex)], // Wave effect from center
                    }),
                  },
                ],
                fontSize: 40,
                fontWeight: 'bold',
                color: '#4F46E5',
                marginHorizontal: 3,
              }}
            >
              {char}
            </Animated.Text>
          );
        })}
      </View>
    </View>
  );
};

export default LoadingScreen;
