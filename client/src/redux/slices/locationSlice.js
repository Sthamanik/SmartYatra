import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  locations: [],  // Array to store multiple locations
  locationPermission: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    addLocation: (state, action) => {
      state.locations.push(action.payload);  // Add a new location to the array
    },
    setLocationPermission: (state, action) => {
      state.locationPermission = action.payload;
    },
    clearLocations: (state) => {
      state.locations = [];  // Clear all stored locations
    },
  },
});

export const { addLocation, setLocationPermission, clearLocations } = locationSlice.actions;

export default locationSlice.reducer;
