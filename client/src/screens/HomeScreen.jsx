import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import { addLocation, setLocationPermission } from '../redux/slices/locationSlice';
import { fetchAddress } from '../redux/slices/reverseGeocodeSlice'; // ✅ Fixed import

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const address = useSelector((state) => state.reverseGeocode.address);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        dispatch(setLocationPermission(true));
        getCurrentLocation();
      } else {
        console.log('Permission denied');
        dispatch(setLocationPermission(false));
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocation(null);
    setLocationError(null);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        };
        setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
        dispatch(addLocation(newLocation));
        dispatch(fetchAddress({ latitude, longitude })); // ✅ Fixed dispatch
        setRefreshing(false);
        console.log('✅ Location fetched:', newLocation);
      },
      (error) => {
        setLocationError(error.message);
        setRefreshing(false);
        console.log('❌ Location error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
        distanceFilter: 0,
        forceRequestLocation: true,
      }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    getCurrentLocation();
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-white px-4 pt-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Top Bar */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 35, height: 35 }}
          />
          <Text className="text-xl font-semibold text-indigo-600 ml-2">
            Smartyatra
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="w-10 h-10 rounded-full border-2 border-indigo-600"
            />
          ) : (
            <Icon name="account-circle" size={35} color="#4F46E5" />
          )}
        </TouchableOpacity>
      </View>

      {/* Current Location */}
      <View className="mb-4">
        <Text className="text-gray-500">Current Location</Text>
        {location ? (
          <Text className="text-lg font-medium text-indigo-600">
            {address || 'Fetching address...'}
          </Text>
        ) : (
          <Text className="text-lg font-medium text-red-500">
            {locationError || 'Fetching location...'}
          </Text>
        )}
      </View>

      {/* Quick Access Cards */}
      <View className="space-y-4 mb-6">
        {/* Book a Ride */}
        <TouchableOpacity
          onPress={() => navigation.navigate('BookRide')}
          className="bg-indigo-600 p-5 rounded-3xl shadow-lg flex-row justify-between items-center"
          style={{ elevation: 5 }}
        >
          <View className="flex-1 pr-4">
            <Text className="text-white text-xl font-bold mb-1">Book a Ride</Text>
            <Text className="text-indigo-200 text-sm">
              Find and board a nearby public bus with ease.
            </Text>
          </View>
          <View className="bg-white rounded-full p-3">
            <Icon name="directions-bus" size={28} color="#4F46E5" />
          </View>
        </TouchableOpacity>

        {/* Current Running Buses */}
        <TouchableOpacity
          onPress={() => navigation.navigate('RunningBuses')}
          className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex-row justify-between items-center mt-2"
          style={{ elevation: 3 }}
        >
          <View className="flex-1 pr-4">
            <Text className="text-indigo-700 text-lg font-semibold mb-1">Current Running Buses</Text>
            <Text className="text-gray-500 text-sm">
              View live status of nearby public transport.
            </Text>
          </View>
          <View className="bg-indigo-100 rounded-full p-3">
            <Icon name="location-on" size={28} color="#4F46E5" />
          </View>
        </TouchableOpacity>

        {/* Nearby Bus Routes */}
        <TouchableOpacity
          onPress={() => navigation.navigate('NearbyRoutes')}
          className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex-row justify-between items-center mt-2"
          style={{ elevation: 3 }}
        >
          <View className="flex-1 pr-4">
            <Text className="text-indigo-700 text-lg font-semibold mb-1">Nearby Bus Routes</Text>
            <Text className="text-gray-500 text-sm">
              Explore common routes near your current location.
            </Text>
          </View>
          <View className="bg-indigo-100 rounded-full p-3">
            <Icon name="map" size={28} color="#4F46E5" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Previous Rides Section */}
      <Text className="text-lg font-semibold text-indigo-600 mb-2">
        Previous Rides
      </Text>
      <View className="space-y-3">
        <Text>No previous rides</Text>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
