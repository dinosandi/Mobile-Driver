// LoginForm.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { useNavigation } from '@react-navigation/native';

const screenHeight = Dimensions.get('window').height;

const LoginForm = () => {
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const response = await api.post('/Auth/login', {
        Email,
        Password,
      });

      console.log('Login successful:', response.data);

      // --- PERBAIKAN DI SINI: Mengambil data langsung dari response.data ---
      const { Token, UserId, Email: userEmail } = response.data; // Destructure langsung

      if (Token) {
        await AsyncStorage.setItem('userToken', Token);
        console.log('Token saved:', Token.substring(0, 30) + '...');
      }
      if (UserId) {
        await AsyncStorage.setItem('loggedInDriverId', String(UserId)); // Pastikan disimpan sebagai string
        console.log('Logged In User ID saved:', UserId);
      }
      // Gunakan Email dari response sebagai userName
      if (userEmail) {
        await AsyncStorage.setItem('userName', userEmail);
        console.log('User Name (Email) saved:', userEmail);
      }

      Alert.alert('Berhasil Login', response.data.Message || 'Welcome!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert(
        'Login Gagal',
        error.response?.data?.Message || 'Terjadi kesalahan saat login. Periksa koneksi atau kredensial Anda.'
      );
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Login Driver</Text>

      <TextInput
        placeholder="Email"
        value={Email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={Password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: screenHeight * 0.08,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#FFD500',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  loginText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
});