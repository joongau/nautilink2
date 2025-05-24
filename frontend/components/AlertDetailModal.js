import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, Linking, Platform } from 'react-native';

export default function AlertDetailModal({ visible, onClose, alert }) {
  if (!alert) return null;

  const openInMaps = () => {
    if (!alert) return;
    const lat = alert.latitude;
    const lng = alert.longitude;
    const label = encodeURIComponent(alert.type || 'Alerte NautiLink');
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{alert.type}</Text>
          <Text style={styles.sub}>👤 Utilisateur #{alert.user_id}</Text>
          <Text style={styles.sub}>{new Date(alert.created_at).toLocaleString()}</Text>
          {alert.comment ? (
            <View style={styles.commentBox}>
              <Text style={styles.comment}>{alert.comment}</Text>
            </View>
          ) : null}
          {alert.photo_url && (
            <Image
              source={{ uri: `http://192.168.1.39:3000/uploads/${alert.photo_url}` }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity onPress={openInMaps} style={styles.mapsButton}>
            <Text style={styles.mapsButtonText}>📍 Ouvrir dans Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonBottom}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
  commentBox: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  comment: {
    fontSize: 14,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonBottom: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapsButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#0077B6',
    borderRadius: 6,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});