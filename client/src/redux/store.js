import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice'
import locationReducer from './slices/locationSlice'

export const store = configureStore ({
    reducer: {
        auth: authReducer,
        location: locationReducer
    }
});