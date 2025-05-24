import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './screens/MapScreen';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TabsNavigator from './components/TabsNavigator';
import SplashScreen from './screens/SplashScreen';
import ProfileScreen from './screens/ProfileScreen';
import AlertTypeScreen from './screens/AlertTypeScreen';
import AlertFormScreen from './screens/AlertFormScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="AlertTypeScreen" component={AlertTypeScreen} options={{ title: 'Signaler une alerte' }} />
        <Stack.Screen name="AlertFormScreen" component={AlertFormScreen} options={{ title: 'Détail de l’alerte' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}