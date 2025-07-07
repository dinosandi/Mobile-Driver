// api/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from 'react-native'; // Import Alert untuk notifikasi global

const api = axios.create({
  baseURL: "https://0xt0ddb5-5230.asse.devtunnels.ms/api", // URL Anda
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Tambahkan timeout, misalnya 10 detik
});

// Add a request interceptor to include the authorization token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken"); // Get the token from AsyncStorage
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Add it to the Authorization header
        console.log("Axios Request Interceptor: Token ditambahkan ke header."); // Debugging
      } else {
        console.warn("Axios Request Interceptor: Token tidak ditemukan di AsyncStorage."); // Debugging
      }
    } catch (e) {
      console.error("Axios Request Interceptor: Gagal mengambil token dari AsyncStorage:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- PERBAIKAN PENTING DI SINI: Menambahkan Response Interceptor ---
api.interceptors.response.use(
  (response) => response, // Jika respon sukses, teruskan
  async (error) => {
    // Tangani error 401 Unauthorized secara global
    if (error.response && error.response.status === 401) {
      console.warn("Axios Response Interceptor: Permintaan tidak sah (401). Token mungkin kadaluarsa atau hilang. Membersihkan sesi.");
      // Hapus semua data sesi dari AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('loggedInDriverId');

      Alert.alert(
        'Sesi Berakhir',
        'Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.',
        [{
          text: 'OK',
          onPress: () => {
          }
        }]
      );
    }
    return Promise.reject(error); // Teruskan error untuk ditangani di komponen yang memanggil API
  }
);

export default api;