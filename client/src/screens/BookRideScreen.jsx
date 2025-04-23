import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

const BookRideScreen = () => {
  const navigation = useNavigation();
  const locations = useSelector((state) => state.location?.locations || []);
  const latestLocation = locations[0];

  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [busStops, setBusStops] = useState([]);

  // Reverse geocode to get address from lat/lng
  const reverseGeocode = async (lat, lon, setter) => {
    try {
      const res = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=YOUR_OPENCAGE_API_KEY`);
      const address = res.data?.results?.[0]?.formatted;
      if (address) setter(address);
    } catch (err) {
      console.error('Reverse geocoding failed', err);
    }
  };

  useEffect(() => {
    if (!latestLocation?.latitude || !latestLocation?.longitude) return;

    // Fetch nearby bus stops
    const getBusStops = async () => {
      const url = `https://nominatim.openstreetmap.org/search.php?q=bus+stop&format=jsonv2&limit=5&lat=${latestLocation.latitude}&lon=${latestLocation.longitude}`;
      const { data } = await axios.get(url);
      setBusStops(data);
    };

    // Set default pickup location to current location
    setPickupCoords({
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
    });

    getBusStops();
  }, [latestLocation]);

  // When pickup or destination marker is moved, update the corresponding state
  const onMarkerDragEnd = (e, type) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    if (type === 'pickup') {
      setPickupCoords({ latitude, longitude });
      reverseGeocode(latitude, longitude, setStartLocation);
    } else if (type === 'destination') {
      setDestinationCoords({ latitude, longitude });
      reverseGeocode(latitude, longitude, setEndLocation);
    }
  };

  if (!latestLocation?.latitude || !latestLocation?.longitude) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-500">Location not available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Top Bar */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-10 bg-white/90 p-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-indigo-600">Book a Ride</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      {/* Map View */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* User's Current Location Marker */}
        <Marker
          coordinate={{
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
          }}
          title="You"
          pinColor="red"
        />

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker
            coordinate={pickupCoords}
            title="Pickup"
            draggable
            pinColor="indigo"
            onDragEnd={(e) => onMarkerDragEnd(e, 'pickup')}
          />
        )}

        {/* Destination Marker */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            draggable
            pinColor="indigo"
            onDragEnd={(e) => onMarkerDragEnd(e, 'destination')}
          />
        )}

        {/* Bus Stops */}
        {busStops.map((stop, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(stop.lat),
              longitude: parseFloat(stop.lon),
            }}
            title="Bus Stop"
            description={stop.display_name}
          >
            <Image
              source={require('../assets/bus-icon.png')}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </Marker>
        ))}
      </MapView>

      {/* Bottom Input Section */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 rounded-t-3xl shadow-lg border-t border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Plan Your Ride</Text>

        {/* Start Location */}
        <View className="flex-row items-center mb-3">
          <Icon name="circle" size={12} color="#4F46E5" style={{ marginRight: 10 }} />
          <View className="flex-1 border-b border-gray-300 pb-1">
            <Text className="text-xs text-gray-400">Start Location</Text>
            <TextInput
              placeholder="Enter pickup point"
              placeholderTextColor="#A0AEC0"
              value={startLocation}
              onChangeText={setStartLocation}
              className="text-base text-gray-700"
            />
          </View>
        </View>

        {/* End Location */}
        <View className="flex-row items-center">
          <Icon name="map-marker" size={16} color="#DC2626" style={{ marginRight: 10 }} />
          <View className="flex-1 border-b border-gray-300 pb-1">
            <Text className="text-xs text-gray-400">Destination</Text>
            <TextInput
              placeholder="Enter drop-off point"
              placeholderTextColor="#A0AEC0"
              value={endLocation}
              onChangeText={setEndLocation}
              className="text-base text-gray-700"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default BookRideScreen;
