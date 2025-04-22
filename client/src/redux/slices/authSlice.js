import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import EncryptedStorage from 'react-native-encrypted-storage';

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async( user, { rejectWithValue }) => {
        try{
            const response = await axiosInstance.post('users/register', user);
            
            // Store the registered user in encrypted storage
            if (response.data.data) {
                await EncryptedStorage.setItem('user', JSON.stringify(response.data.data));
            }

            return response.data.data;

        } catch ( err ){
            console.log(err)
            return rejectWithValue(err.response?.data );
        }
    }
)

export const verifyOTP = createAsyncThunk(
    'auth/verifyOTP',
    async ({email, otp}, {rejectWithValue}) => {
        try {
            const response = await axiosInstance.post('/users/verifyOTP', {email, otp});
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data );
        }
    }
)

export const resendOTP = createAsyncThunk(
    'auth/resendOTP',
    async (email, {rejectWithValue}) => {
        try {
            const response = await axiosInstance.post('/users/resendOTP', email);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
)

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({email, password}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/users/login', {email, password});
            const { user, accessToken , refreshToken } = response.data.data;

            if (accessToken && refreshToken) {
                await EncryptedStorage.setItem('accessToken', accessToken);
                await EncryptedStorage.setItem('refreshToken', refreshToken);
            }
            
            return { user, accessToken, refreshToken };
        } catch ( err ){
            return rejectWithValue(err?.response?.data);
        }
    }
)

const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
    isAuthenticated: false
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.loading = false;
            state.error = null;
            state.isAuthenticated = false;
            
            // Clear encrypted storage
            EncryptedStorage.removeItem('accessToken');
            EncryptedStorage.removeItem('refreshToken');
            EncryptedStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
        // register cases
        .addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        })
        .addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        // login cases
        .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
        })
        // verify OTP cases
        .addCase(verifyOTP.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(verifyOTP.fulfilled, (state, action) => {
            state.loading = false;
            state.error = null;
            if (state.user) {
                state.user.isVerified = true;
            }
        })
        .addCase(verifyOTP.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        // resend OTP cases
        .addCase(resendOTP.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(resendOTP.fulfilled, (state) => {
            state.loading = false;
            state.error = null;
        })
        .addCase(resendOTP.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    }
})

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;