import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const screenHeight = Dimensions.get('window').height;

const LoginForm = () => {
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Login'); 
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Ilustrasi Background */}
      <Image
        source={require('../assets/driver.jpg')}
        style={styles.illustration}
        resizeMode="contain"
      />

      {/* Tombol Login */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: screenHeight * 0.05,
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 100,
    marginBottom: 20,
  },
  illustration: {
    width: 300,
    height: 300,
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: '#FFD500',
    paddingVertical: 12,
    paddingHorizontal: 80,
    borderRadius: 8,
    elevation: 4,
    marginTop: 30,
  },
  loginText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});
