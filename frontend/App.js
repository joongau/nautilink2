import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './screens/MapScreen';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import ProfileScreen from './screens/ProfileScreen';
import AlertTypeScreen from './screens/AlertTypeScreen';
import AlertFormScreen from './screens/AlertFormScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="AlertTypeScreen" component={AlertTypeScreen} options={{ title: 'Signaler une alerte' }} />
          <Stack.Screen name="AlertFormScreen" component={AlertFormScreen} options={{ title: 'Détail de l’alerte' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}