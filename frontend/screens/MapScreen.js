import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import alertTypes from '../constants/alertTypes';
import AlertDetailModal from '../components/AlertDetailModal';
import AlertCard from '../components/AlertCard';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filterType, setFilterType] = useState('toutes');
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = screenHeight * 0.6;
  const animatedSheetY = useRef(new Animated.Value(-sheetHeight + 250)).current;
  // Ouvre le panneau animé au lancement
  useEffect(() => {
    Animated.spring(animatedSheetY, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.dy + (animatedSheetY._value || 0);
        if (newY >= -sheetHeight + 250 && newY <= 0) {
          animatedSheetY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          // swipe down to open
          Animated.spring(animatedSheetY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // swipe up to close
          Animated.spring(animatedSheetY, {
            toValue: -sheetHeight + 250,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Fonction pour charger les alertes (réutilisable pour le rafraîchissement auto)
  const fetchAlerts = async () => {
    setIsRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://192.168.1.39:3000/api/alerts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filtered = (data.alerts || []).filter(alert => new Date(alert.created_at) >= last24h);
      const userId = JSON.parse(atob(token.split('.')[1])).userId;
      const withOwnership = filtered.map(a => ({ ...a, isMine: a.user_id === userId }));
      setAlerts(withOwnership);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des alertes:', err);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée pour accéder à la position.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 30000);
    return () => clearInterval(intervalId);
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
              onPress={() => {
                setSelectedAlert(alert);
                setModalVisible(true);
              }}
            >
              <Text style={{ fontSize: 24 }}>
                {alertTypes.find((a) => a.type === alert.type)?.icon || '❓'}
              </Text>
            </Marker>
          ))}
      </MapView>

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate('AlertTypeScreen')}
      >
        <Text style={styles.reportButtonText}>➕ Signaler</Text>
      </TouchableOpacity>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: sheetHeight,
            backgroundColor: '#FFFFFFEE',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 6,
            top: animatedSheetY,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 48,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() => {
                  setSelectedAlert(alert);
                  setModalVisible(true);
                }}
              />
            ))}
          </ScrollView>
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 12 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#aaa', marginBottom: 6 }} />
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#023E8A', marginBottom: 4 }}>📋 Alertes récentes</Text>
            {isRefreshing && (
              <ActivityIndicator size="small" color="#888" style={{ marginBottom: 4 }} />
            )}
            {lastUpdated && (
              <Text style={{ fontSize: 10, color: '#888' }}>
                Mis à jour à {lastUpdated.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
      <AlertDetailModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedAlert(null);
        }}
        alert={selectedAlert}
      />
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
    // removed
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
  },
  reportButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#0077B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alertListTitleContainer: {
    // removed
  },
  alertListTitle: {
    // removed
  }
});