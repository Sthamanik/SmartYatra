import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const axiosInstance = axios.create({
    baseURL: 'http://192.168.1.86:3000/api/v1/',
    headers: {
        'Content-Type': 'application/json',
    }
})

axiosInstance.interceptors.request.use( async (config) => {
    const accessToken = await EncryptedStorage.getItem('accessToken')
    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
})

export default axiosInstance;