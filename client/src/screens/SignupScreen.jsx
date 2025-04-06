import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from '../redux/slices/authSlice';
import ErrorModal from '../components/ErrorModal'

const SignUpScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCpassword] = useState('');
  const [phone, setPhone] = useState('');
  const [DOB, setDOB] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCpassword, setShowCpassword] = useState(false);
  const [errors, setErrors] = useState({ fullname: '', email: '', phone: '', DOB: '', password: '', cpassword: '' });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 

  const fullnameRegex = /^[A-Za-z\s]{3,26}$/;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  const phoneRegex = /^(?:\+977)?(98\d{8}|97\d{8}|01\d{7})$/;

  const validateFullname = () => {
    if (!fullname) {
      setErrors((prev) => ({...prev, fullname: 'Full name is required' }));
    } else if (!fullnameRegex.test(fullname)) {
      setErrors((prev) => ({...prev, fullname: 'Full name must be between 3 and 26 characters and contain only alphabets and spaces' }));
    } else {
      setErrors((prev) => ({...prev, fullname: '' }));
    }
  }

  const validateEmail = () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    } else if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
    } else {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const validatePhone = () => {
    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: 'Phone number is required' }));
    } else if (!phoneRegex.test(phone)) {
      setErrors((prev) => ({ ...prev, phone: 'Phone number must be 10 digits, starting with 98, 97, or 01' }));
    } else {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const validatePassword = () => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    } else if (!passwordRegex.test(password)) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters, contain an uppercase letter, a number, and a special character' }));
    } else {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const validateConfirmPassword = () => {
    if (!password) {
      setErrors((prev) => ({ ...prev, cpassword: 'Confirm Password is required' }));
    } else if ( cpassword !== password ) {
      setErrors((prev) => ({ ...prev, cpassword: 'Passwords doesn\'t match' }));
    } else {
      setErrors((prev) => ({ ...prev, cpassword: '' }));
    }
  }

  const isFormValid = () => {
    return (
      fullname &&
      email &&
      phone &&
      DOB &&
      password &&
      cpassword &&
      !errors.fullname &&
      !errors.email &&
      !errors.phone &&
      !errors.DOB &&
      !errors.password &&
      !errors.cpassword &&
      password === cpassword
    )
  };

  const handleSignUp = async () => {
    try{
      console.log("registring.....")
      const user = {
        fullname,
        email,
        phone,
        DOB: DOB ? DOB.toISOString().split('T')[0] : '',
        password,
      }

      const res = await dispatch(registerUser (user)).unwrap()
      navigation.navigate('Otp')
    }catch (err){
      setErrorMessage(err.message);
      setModalVisible(true);
    }
  };

  return (
    <>
      <ErrorModal
        visible={modalVisible}
        source="Signup"
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
                <Text className="text-gray-600 text-lg">
                  Your Smart Ride Companion
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-xl font-bold text-indigo-700 mb-6">
                  Create Your Account
                </Text>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Full Name</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="person-outline" size={20} color="#6366f1" />
                    <TextInput 
                      className="flex-1 ml-2 text-gray-800" 
                      placeholder="Enter your full name" 
                      value={fullname} 
                      onChangeText= {(text) => {
                        setFullname(text); 
                        if (fullnameRegex.test(text)){
                          setErrors((prev) => ({...prev, fullname: ''}));
                        }
                      }}
                      onBlur={validateFullname}
                      autoCapitalize='none'
                    />
                  </View>
                  {errors.fullname ? <Text className="text-red-500 text-sm mt-1">{errors.fullname}</Text> : null}
                </View>

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
                        if (emailRegex.test(text)){
                          setErrors((prev) => ({...prev, email: ''}));
                        }
                      }}
                      onBlur={validateEmail} 
                      keyboardType="email-address" 
                      autoCapitalize="none" 
                    />
                  </View>
                  {errors.email ? <Text className="text-red-500 text-sm mt-1">{errors.email}</Text> : null}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Phone Number</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="call-outline" size={20} color="#6366f1" />
                    <TextInput 
                      className="flex-1 ml-2 text-gray-800" 
                      placeholder="Enter your phone number" 
                      value={phone} 
                      onChangeText={(text) => {
                        setPhone(text);
                        if (phoneRegex.test(text)) {
                          setErrors((prev) => ({ ...prev, phone: '' }));
                        }
                      }} 
                      onBlur={validatePhone} 
                      keyboardType="phone-pad" 
                    />
                  </View>
                  {errors.phone ? <Text className="text-red-500 text-sm mt-1">{errors.phone}</Text> : null}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Date of Birth</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-4">
                    <Ionicons name="calendar-number-outline" size={20} color="#6366f1" />
                    <TouchableOpacity className="flex-1 ml-2 text-gray-800" onPress={() => setShowDatePicker(true)}>
                      <Text className="text-gray-800">
                        {DOB ? DOB.toDateString() : ""}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={DOB || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        
                        if (selectedDate) {
                          setDOB(selectedDate); // Update state
                          const today = new Date();
                          const minValidDate = new Date(
                            today.getFullYear() - 14, 
                            today.getMonth(), 
                            today.getDate()
                          );
                        
                          // Use selectedDate directly for validation
                          if (selectedDate >= minValidDate) {
                            setErrors((prev) => ({ ...prev, DOB: 'Must be at least 14 years old' }));
                          } else {
                            setErrors((prev) => ({ ...prev, DOB: '' }));
                          }
                        } else {
                          setErrors((prev) => ({ ...prev, DOB: 'Date of Birth is required' }));
                        }
                      }}
                    />
                  )}

                  {errors.DOB ? <Text className="text-red-500 text-sm mt-1">{errors.DOB}</Text> : null}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Password</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
                    <TextInput 
                      className="flex-1 ml-2 text-gray-800"  
                      placeholder="Enter your password" 
                      value={password} 
                      onChangeText={(text) => {
                        setPassword(text); 
                        if (passwordRegex.test(text)){
                          setErrors((prev) => ({...prev, password: ''}));
                        }
                      }} 
                      onBlur={validatePassword}
                      secureTextEntry={!showPassword} 
                      autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20}  
                        color="#6366f1" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text className="text-red-500 text-sm mt-1">{errors.password}</Text> : null}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Confirm Password</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
                    <TextInput 
                      className="flex-1 ml-2 text-gray-800"  
                      placeholder="Enter your password" 
                      value={cpassword} 
                      onChangeText={(text) => {
                        setCpassword(text); 
                        if (passwordRegex.test(text)){
                          setErrors((prev) => ({...prev, cpassword: ''}));
                        }
                      }} 
                      onBlur={validateConfirmPassword}
                      secureTextEntry={!showCpassword} 
                      autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowCpassword(!showCpassword)}>
                      <Ionicons 
                        name={showCpassword ? "eye-off-outline" : "eye-outline"} 
                        size={20}  
                        color="#6366f1" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.cpassword ? <Text className="text-red-500 text-sm mt-1">{errors.cpassword}</Text> : null}
                </View>

                <TouchableOpacity
                  className={`py-3 rounded-lg items-center mb-4 ${isFormValid() ? 'bg-indigo-500' : 'bg-gray-400'}`}
                  onPress={handleSignUp}
                  disabled={!isFormValid()} 
                >
                  <Text className="text-white font-bold text-lg">Sign Up</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-center">
                <Text className="text-gray-700">Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} className="ml-1">
                  <Text className="text-indigo-600 font-semibold">Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignUpScreen;