import React, { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

const OtpScreen = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");

  const inputs = useRef([]);

  useEffect(() => {
    if (timer === 0) return;
    const countdown = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = otp.join("");
    if (code.length !== 6 || code.includes("")) {
      setError("Enter the full 6-digit code");
      return;
    }
    setError("");
    console.log("OTP Submitted:", code);
    // API call goes here
  };

  const handleResend = () => {
    if (timer === 0) {
      setOtp(Array(6).fill(""));
      setTimer(30);
      console.log("Resending OTP...");
      // Resend OTP API call
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <Text className="text-2xl font-bold mb-2">Enter OTP</Text>
      <Text className="text-base text-gray-500 mb-6">Check your phone for the 6-digit code</Text>

      <View className="flex-row space-x-2 mb-4">
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={ref => (inputs.current[idx] = ref)}
            value={digit}
            onChangeText={text => handleChange(text, idx)}
            onKeyPress={e => handleKeyPress(e, idx)}
            keyboardType="numeric"
            maxLength={1}
            className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl"
          />
        ))}
      </View>

      {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit}
        className="w-full bg-blue-600 py-3 rounded-full items-center mb-4"
      >
        <Text className="text-white font-semibold text-lg">Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={timer > 0}
        className={`mt-2 ${timer > 0 ? "opacity-50" : "opacity-100"}`}
      >
        <Text className="text-blue-600 text-sm">
          {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OtpScreen;
