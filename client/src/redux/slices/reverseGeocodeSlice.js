// redux/slices/reverseGeocodeSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { OPENCAGE_API_KEY } from 'react-native-dotenv';

export const fetchAddress = createAsyncThunk(
  'reverseGeocode/fetchAddress',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
      );

      if (res.data.status.code === 200) {
        const components = res.data.results[0]?.components;
        const city = components?.city || components?.town || components?.village;
        const neighbourhood = components?.neighbourhood;
        const formattedAddress = res.data.results[0]?.formatted;

        return city ? `${city}, ${neighbourhood}` : formattedAddress;
      } else {
        return rejectWithValue(res.data.status.message);
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Error fetching address');
    }
  }
);

const reverseGeocodeSlice = createSlice({
  name: 'reverseGeocode',
  initialState: {
    address: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAddress: (state) => {
      state.address = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddress.fulfilled, (state, action) => {
        state.address = action.payload;
        state.loading = false;
      })
      .addCase(fetchAddress.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { clearAddress } = reverseGeocodeSlice.actions;
export default reverseGeocodeSlice.reducer;
