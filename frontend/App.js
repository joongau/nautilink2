import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  const [message, setMessage] = useState('Chargement...');

  useEffect(() => {
    fetch('http://192.168.1.39:3000/') // Remplace par ton IP locale
      .then((res) => res.text())
      .then((text) => setMessage(text))
      .catch((err) => {
        console.error(err);
        setMessage("Erreur lors de l'appel API");
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});