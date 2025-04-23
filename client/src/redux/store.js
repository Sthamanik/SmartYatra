import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice'
import locationReducer from './slices/locationSlice'
import reverseGeocodeReducer from './slices/reverseGeocodeSlice'

export const store = configureStore ({
    reducer: {
        auth: authReducer,
        location: locationReducer,
        reverseGeocode: reverseGeocodeReducer,
    }
});