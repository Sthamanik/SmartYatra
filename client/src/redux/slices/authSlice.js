import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import EncryptedStorage from 'react-native-encrypted-storage';

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async( user, { rejectWithValue }) => {
        try{
            const response = await axiosInstance.post('users/register', user);

            return response.data;

        } catch ( err ){
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
            console.log(err)
            return rejectWithValue(err?.response?.data);
        }
    }
)

const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null
}

const authSLice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.loading = false;
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
            state.user = action.payload.user;
            state.accessToken = null;
            state.refreshToken = null;
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
            console.log(action.payload)
            state.loading = false;
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
    }
})

export const { logout } = authSLice.actions;
export default authSLice.reducer;