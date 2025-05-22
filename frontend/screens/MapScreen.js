import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, Pressable, Image, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import alertTypes from '../constants/alertTypes';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filterType, setFilterType] = useState('toutes');
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée pour accéder à la position.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const token = await AsyncStorage.getItem('token');
      try {
        const res = await fetch('http://192.168.1.39:3000/api/alerts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const filtered = (data.alerts || []).filter(alert => {
          return new Date(alert.created_at) >= last24h;
        });
        const userId = JSON.parse(atob(token.split('.')[1])).userId;
        const withOwnership = filtered.map(a => ({ ...a, isMine: a.user_id === userId }));
        setAlerts(withOwnership);
      } catch (err) {
        console.error('Erreur lors du chargement des alertes:', err);
      }
    })();
  }, []);

  const handleReportAlert = async (type) => {
    if (!location || !type) return;

    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('http://192.168.1.39:3000/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          type,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('✅ Alerte enregistrée', `Type : ${type}`);
        setAlerts((prev) => [data.alert, ...prev]);
      } else {
        Alert.alert('Erreur', data.message || 'Échec de l’enregistrement');
      }
    } catch (err) {
      console.error('Erreur POST /api/alerts', err);
      Alert.alert('Erreur réseau');
    }
  };

  const handleCapturePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission refusée", "Autorisez l'accès à l'appareil photo pour prendre une photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const token = await AsyncStorage.getItem('token');
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename ?? '');
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('photo', {
        uri,
        name: filename,
        type,
      });

      try {
        const response = await fetch('http://192.168.1.39:3000/api/alerts/photo', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          Alert.alert("✅ Photo enregistrée", `Alerte ID : ${data.alertId}`);
        } else {
          Alert.alert("Erreur", data.message || 'Échec de l’enregistrement');
        }
      } catch (error) {
        console.error('Upload photo error:', error);
        Alert.alert('Erreur réseau');
      }
    }
  };

  const handleDeleteAlert = async (alertId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`http://192.168.1.39:3000/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        Alert.alert("🗑️ Supprimé", "L’alerte a été supprimée.");
      } else {
        Alert.alert("Erreur", data.message || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      Alert.alert("Erreur réseau");
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
      >
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Vous êtes ici"
        />
        {alerts
          .filter((a) => filterType === 'toutes' || a.type.toLowerCase().includes(filterType))
          .map((alert) => (
            <Marker
              ref={(ref) => {
                if (ref) markerRefs.current[alert.id] = ref;
                if (ref && selectedAlertId === alert.id) {
                  ref.showCallout();
                }
              }}
              key={alert.id}
              coordinate={{
                latitude: parseFloat(alert.latitude),
                longitude: parseFloat(alert.longitude),
              }}
              title={alert.type}
              description={`Signalé par utilisateur #${alert.user_id}`
                + (alert.comment ? `\nCommentaire : ${alert.comment}` : '')
                + (alert.photo_url ? `\nPhoto jointe` : '')}
              pinColor={
                alert.type.toLowerCase().includes('panne')
                  ? 'orange'
                  : alert.type.toLowerCase().includes('obstacle')
                  ? 'purple'
                  : 'red'
              }
              onPress={() => {
                let message = `📍 Coordonnées : ${alert.latitude}, ${alert.longitude}\n📅 Date : ${new Date(alert.created_at).toLocaleString()}\n👤 Utilisateur : #${alert.user_id}`;
                if (alert.comment) message += `\n📝 Commentaire : ${alert.comment}`;
                if (alert.photo_url) message += `\n🖼️ Photo jointe`;

                Alert.alert(`🧭 Alerte : ${alert.type}`, message, [
                  alert.photo_url ? {
                    text: 'Voir la photo',
                    onPress: () => {
                      setSelectedImageUri(`http://192.168.1.39:3000/uploads/${alert.photo_url}`);
                      setModalVisible(true);
                    }
                  } : undefined,
                  { text: 'OK' }
                ].filter(Boolean));
              }}
            />
          ))}
      </MapView>
      <View style={styles.filterButtons}>
        {['toutes', 'danger', 'panne', 'obstacle'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type)}
            style={[
              styles.filterButton,
              filterType === type && styles.filterButtonActive,
            ]}
          >
            <Text style={{ color: filterType === type ? 'white' : 'black' }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.legend}>
        <Text>🟥 Danger • 🟧 Panne • 🟪 Obstacle</Text>
      </View>
      <TouchableOpacity style={styles.floatingButtonLeft} onPress={handleCapturePhoto}>
        <Text style={styles.floatingButtonText}>📷</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AlertTypeScreen')}
      >
        <Text style={styles.floatingButtonText}>🚨</Text>
      </TouchableOpacity>
      <View style={styles.alertCount}>
        <Text>
          {alerts.filter((a) => filterType === 'toutes' || a.type.toLowerCase().includes(filterType)).length} alerte(s) affichée(s)
        </Text>
      </View>
      <View style={styles.alertList}>
        <Text style={styles.alertListTitle}>📋 Dernières alertes :</Text>
        <ScrollView>
          {alerts
            .filter((a) => filterType === 'toutes' || a.type.toLowerCase().includes(filterType))
            .map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                onPress={() => {
                  setSelectedAlertId(alert.id);
                  mapRef.current.animateToRegion({
                    latitude: parseFloat(alert.latitude),
                    longitude: parseFloat(alert.longitude),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 500);
                  setTimeout(() => {
                    if (markerRefs.current[alert.id]) {
                      markerRefs.current[alert.id].showCallout();
                    }
                  }, 600);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertText}>
                    • {alert.type} — {new Date(alert.created_at).toLocaleTimeString()} par utilisateur #{alert.user_id}
                  </Text>
                  {alert.photo_url ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImageUri(`http://192.168.1.39:3000/uploads/${alert.photo_url}`);
                        setModalVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: `http://192.168.1.39:3000/uploads/${alert.photo_url}` }}
                        style={styles.alertImage}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {alert.isMine && (
                  <TouchableOpacity onPress={() => handleDeleteAlert(alert.id)} style={{ marginLeft: 8 }}>
                    <Text style={{ color: 'red' }}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
      <Modal visible={modalVisible} transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={() => setModalVisible(false)} style={{ position: 'absolute', top: 40, right: 20, zIndex: 1 }}>
            <Text style={{ color: 'white', fontSize: 20 }}>✖</Text>
          </Pressable>
          <Image
            source={{ uri: selectedImageUri }}
            style={{ width: '90%', height: '70%', borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#e74c3c',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  floatingButtonLeft: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#3498db',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 30,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  alertList: {
    position: 'absolute',
    bottom: 170,
    left: 10,
    right: 10,
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 8,
    maxHeight: 150,
  },
  alertListTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  alertItem: {
    marginBottom: 4,
  },
  alertItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  alertText: {
    fontSize: 13,
  },
  alertImage: {
    width: 50,
    height: 50,
    marginTop: 4,
    borderRadius: 6,
  },
  filterButtons: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  alertCount: {
    position: 'absolute',
    bottom: 330,
    left: 20,
    backgroundColor: '#ffffffcc',
    padding: 6,
    borderRadius: 6,
  },
  alertTypeButton: {
    position: 'absolute',
    backgroundColor: '#e67e22',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  alertTypeText: {
    fontSize: 24,
    color: 'white',
  },
  alertTypeLabel: {
    position: 'absolute',
    right: 70,
    backgroundColor: '#ffffffee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: '#333',
    fontSize: 12,
  }
});