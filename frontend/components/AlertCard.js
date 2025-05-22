

import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';

export default function AlertCard({ alert, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          • {alert.type} — {new Date(alert.created_at).toLocaleTimeString()} par utilisateur #{alert.user_id}
        </Text>
        {alert.comment ? (
          <Text style={styles.comment}>{alert.comment}</Text>
        ) : null}
      </View>
      {alert.photo_url && (
        <Image
          source={{ uri: `http://192.168.1.39:3000/uploads/${alert.photo_url}` }}
          style={styles.thumbnail}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  comment: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    color: '#333',
  },
  thumbnail: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 6,
  },
});