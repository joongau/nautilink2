

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import alertTypes from '../constants/alertTypes';

export default function AlertFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params;

  const alertInfo = alertTypes.find((a) => a.type === type);

  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert("Permission refusée", "Autorisez l'accès à l'appareil photo.");
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('token');
    const location = await Location.getCurrentPositionAsync({});
    const formData = new FormData();

    formData.append('type', type);
    formData.append('comment', comment);
    formData.append('latitude', location.coords.latitude);
    formData.append('longitude', location.coords.longitude);
    if (photo) {
      const filename = photo.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename ?? '');
      const ext = match ? match[1] : 'jpg';
      formData.append('photo', {
        uri: photo.uri,
        name: `photo.${ext}`,
        type: `image/${ext}`
      });
    }

    try {
      const response = await fetch('http://192.168.1.39:3000/api/alerts/photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('✅ Alerte envoyée', alertInfo.label);
        navigation.navigate('Map');
      } else {
        Alert.alert('Erreur', data.message || 'Échec de l’enregistrement');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur réseau');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{alertInfo.icon}</Text>
      <Text style={styles.title}>{alertInfo.label}</Text>
      <Text style={styles.description}>{alertInfo.description}</Text>

      <TextInput
        style={styles.input}
        placeholder="Ajouter un commentaire (facultatif)"
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity onPress={handleTakePhoto} style={styles.photoButton}>
        <Text style={styles.photoButtonText}>📷 Joindre une photo</Text>
      </TouchableOpacity>

      {photo && (
        <Image source={{ uri: photo.uri }} style={styles.preview} />
      )}

      <Button title="🚀 Envoyer l'alerte" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ecf0f1',
    flex: 1,
  },
  icon: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center'
  },
  description: {
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#444',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 20,
    padding: 10,
    borderRadius: 8,
    minHeight: 80,
    backgroundColor: 'white'
  },
  photoButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  photoButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10
  }
});