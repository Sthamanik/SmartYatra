import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';

// Helper function to generate a random point within a radius (in kilometers)
const getRandomLocationWithinRadius = (latitude, longitude, radiusInKm) => {
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomDistance = Math.random() * radiusInKm;
  
  // Earth radius in km
  const earthRadiusKm = 6371;

  const deltaLatitude = (randomDistance / earthRadiusKm) * (180 / Math.PI);
  const deltaLongitude = (randomDistance / earthRadiusKm) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);

  const randomLatitude = latitude + deltaLatitude * Math.sin(randomAngle);
  const randomLongitude = longitude + deltaLongitude * Math.cos(randomAngle);

  return { latitude: randomLatitude, longitude: randomLongitude };
};

const BookRideScreen = () => {
  const navigation = useNavigation();
  const locations = useSelector((state) => state.location.locations);
  const latestLocation = locations[0]; // get the latest location of the user

  // Define buses with initial positions within the 5 km radius
  const [buses, setBuses] = useState([
    { id: 1, latitude: latestLocation.latitude, longitude: latestLocation.longitude },
    { id: 2, latitude: latestLocation.latitude, longitude: latestLocation.longitude },
    { id: 3, latitude: latestLocation.latitude, longitude: latestLocation.longitude },
    { id: 4, latitude: latestLocation.latitude, longitude: latestLocation.longitude },
    { id: 5, latitude: latestLocation.latitude, longitude: latestLocation.longitude },
  ]);

  const radiusInKm = 5; // Radius for bus movement

  // Function to simulate smooth bus movement within the 5 km radius
  const moveBuses = () => {
    setBuses((prevBuses) =>
      prevBuses.map((bus) => {
        // Get a new random location within 5 km radius of the user's current location
        const newLocation = getRandomLocationWithinRadius(latestLocation.latitude, latestLocation.longitude, radiusInKm);
        return { ...bus, latitude: newLocation.latitude, longitude: newLocation.longitude };
      })
    );
  };

  // Start moving buses every second
  useEffect(() => {
    const intervalId = setInterval(moveBuses, 1000); // Move buses every 1 second
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [latestLocation]);

  if (!latestLocation) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-500">Location not available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Top Bar */}
      <SafeAreaView className="z-10 absolute top-0 left-0 right-0 bg-white/90 p-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#4F46E5" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-indigo-600">Book a Ride</Text>
        <View style={{ width: 28 }} /> {/* Spacer to balance the back icon */}
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
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User's current location */}
        <Marker coordinate={{ latitude: latestLocation.latitude, longitude: latestLocation.longitude }} title="You" />

        {/* Moving Buses */}
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{
              latitude: bus.latitude,
              longitude: bus.longitude,
            }}
            title={`Bus ${bus.id}`}
            description={`Bus ${bus.id} is moving!`}
          >
            <Image
              source={require('../assets/bus-icon.png')} // Add your bus image here
              style={{ width: 30, height: 30 }}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default BookRideScreen;
