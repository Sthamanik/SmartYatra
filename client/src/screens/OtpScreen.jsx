import React, { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, Alert } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from "react-redux";
import EncryptedStorage from 'react-native-encrypted-storage';
import { verifyOTP, resendOTP } from '../redux/slices/authSlice';
import ErrorModal from '../components/ErrorModal';

const OtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const fromScreen = route.params?.fromScreen || 'signup';
  const [email, setEmail] = useState(route.params?.email || "");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const inputs = useRef([]);

  useEffect(() => {
    const fetchEmail = async () => {
      if (!email && fromScreen === 'signup') {
        try {
          const storedUser = await EncryptedStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setEmail(parsed?.user?.email || "");
            console.log(parsed?.user?.email)
          }
        } catch (e) {
          console.log("Failed to fetch email from EncryptedStorage:", e);
        }
      }
    };
    fetchEmail();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError("");

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      shakeError();
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(verifyOTP({ email, otp: code })).unwrap();
      if (fromScreen === 'login') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Verification failed');
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer === 0) {
      setIsLoading(true);
      try {
        await dispatch(resendOTP(email)).unwrap();
        setTimer(60);
        setCanResend(false);
        Alert.alert('Success', 'OTP has been resent to your email');
      } catch (error) {
        setErrorMessage(error.message || 'Failed to resend OTP');
        setModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setOtp(Array(6).fill(""));
    setError("");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ErrorModal
        visible={modalVisible}
        source="OTP"
        message={errorMessage}
        onClose={handleModalClose}
      />

      <View className="absolute top-0 left-0 right-0 h-72 bg-indigo-600">
        <View className="absolute bottom-0 left-0 right-0 h-32 bg-gray-50 rounded-t-[32px]" />
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }}
        className="flex-1 justify-center items-center px-6"
      >
        <View className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Enter OTP</Text>
            <Text className="text-base text-gray-500 text-center">
              {fromScreen === 'login'
                ? "Verify your email first to login to the app"
                : "We've sent a verification code to your registered email"}
            </Text>
          </View>

          <Animated.View
            style={{ transform: [{ translateX: shakeAnimation }] }}
            className="flex-row justify-between mb-6"
          >
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={ref => (inputs.current[idx] = ref)}
                value={digit}
                onChangeText={text => handleChange(text, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="numeric"
                maxLength={1}
                className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-semibold bg-white focus:border-indigo-600 shadow-sm"
                selectTextOnFocus
              />
            ))}
          </Animated.View>

          {error ? (
            <Text className="text-red-500 mb-4 text-center font-medium">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={isLoading}
            className={`w-full bg-indigo-600 py-4 rounded-xl items-center mb-4 ${isLoading ? 'opacity-70' : ''} shadow-lg shadow-indigo-200`}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? "Verifying..." : "Verify Code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={timer > 0 || isLoading}
            className={`w-full py-4 rounded-xl items-center ${timer > 0 ? 'opacity-50' : ''}`}
          >
            <Text className="text-indigo-600 font-semibold">
              {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default OtpScreen;
