import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from '../redux/slices/authSlice';
import ErrorModal from '../components/ErrorModal'


const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const validateEmail = () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    } else if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
    } else {
      setErrors((prev) => ({ ...prev, email: '' })); // ✅ Remove error if valid
    }
  };

  const validatePassword = () => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    } else if (!passwordRegex.test(password)) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters and contain a uppercase letter , a number and a special character' }));
    } else {
      setErrors((prev) => ({ ...prev, password: '' })); // ✅ Remove error if valid
    }
  };

  const handleLogin = async () => {
    try {
      console.log("logging in .....")
      await dispatch(loginUser({ email, password })).unwrap();
      navigation.navigate('Home')
      // Navigation will be handled automatically by App.jsx based on auth state
    } catch (error) {
      // Check if the error is due to unverified user
      if (error.message === "User is not verified. Verify your email first.") {
        // Navigate to OTP screen for verification
        navigation.navigate('Otp', { 
          email: email,
          fromScreen: 'login'
        });
      }
      else if (error.message === "User not found") {
        setEmail('')
        setPassword('')
        setErrorMessage('User not found');
        setModalVisible(true);
        setTimeout(() => {
          navigation.navigate('Signup')
        }, 3000);
      }
      else {
        // Handle other errors
        setErrorMessage(error.message || 'Login failed');
        setModalVisible(true);
      }
    }
  };

  return (
    <>
      <ErrorModal
        visible={modalVisible}
        source="Login"
        message={errorMessage}
        onClose={() => setModalVisible(false)} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1 bg-indigo-50">
            <View className="flex-1 px-5 py-10">
              <View className="items-center mb-10">
                <Image source={require('../assets/logo.png')} className="w-32 h-32" resizeMode="contain" />
                <Text className="text-3xl font-bold text-indigo-500">SmartYatra</Text>
                <Text className="text-gray-600 text-lg">Your Smart Ride Companion</Text>
              </View>

              <View className="mb-6">
                <Text className="text-xl font-bold text-indigo-700 mb-6">Login to Your Account</Text>

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Email Address</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="mail-outline" size={20} color="#6366f1" />
                    <TextInput
                      className="flex-1 ml-2 text-gray-800"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailRegex.test(text)) {
                          setErrors((prev) => ({ ...prev, email: '' })); // ✅ Remove error when valid
                        }
                      }}
                      onBlur={validateEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.email ? <Text className="text-red-500 text-sm mt-1">{errors.email}</Text> : null}
                </View>

                {/* Password Input */}
                <View className="mb-2">
                  <Text className="text-gray-700 mb-2 text-sm">Password</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
                    <TextInput
                      className="flex-1 ml-2 text-gray-800"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordRegex.test(text)) {
                          setErrors((prev) => ({ ...prev, password: '' })); // ✅ Remove error when valid
                        }
                      }}
                      onBlur={validatePassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text className="text-red-500 text-sm mt-1">{errors.password}</Text> : null}
                </View>

                {/* Remember Me & Forgot Password */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} className="mr-2">
                      <View className={`w-5 h-5 border rounded ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'border-gray-400'} justify-center items-center`}>
                        {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                    </TouchableOpacity>
                    <Text className="text-gray-700 text-sm">Remember me</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text className="text-indigo-600 text-sm font-semibold">Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  className={`py-3 rounded-lg items-center mb-4 ${email && password && errors.email === '' && errors.password === '' ? 'bg-indigo-500' : 'bg-gray-400'}`}
                  onPress={handleLogin}
                  disabled={!email || !password || errors.email || errors.password ? true : false} 
                >
                  <Text className="text-white font-bold text-lg">Login</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View className="flex-row justify-center">
                <Text className="text-gray-700">Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} className="ml-1">
                  <Text className="text-indigo-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

export default LoginScreen;
