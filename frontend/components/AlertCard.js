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
    backgroundColor: '#E8F7FF', // soft blue
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0077B6',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#023E8A', // navy blue
  },
  comment: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    color: '#023E8A',
  },
  thumbnail: {
    width: 52,
    height: 52,
    marginLeft: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90E0EF',
  },
});