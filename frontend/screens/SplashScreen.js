import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        navigation.replace('Login');
        return;
      }

      try {
        const response = await fetch('http://192.168.1.39:3000/api/profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          navigation.replace('Tabs');
        } else {
          await AsyncStorage.removeItem('token');
          navigation.replace('Login');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du token', err);
        navigation.replace('Login');
      }
    };

    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚤</Text>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: {
    fontSize: 64,
    marginBottom: 20,
  },
});