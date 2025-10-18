import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import WardrobeScreen from './src/screens/WardrobeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import CameraScreen from './src/screens/CameraScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import AuthScreen from './src/screens/AuthScreen';

// Import context
import { DataProvider } from './src/context/DataContext';

// Import navigation
import { navigationRef, navigationService } from './src/navigation/NavigationService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Wardrobe') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00132d',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#00132d',
        },
        headerTintColor: '#fff7d7',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
      screenListeners={{
        tabPress: (e) => {
          // Update navigation service when tab is pressed
          const routeName = e.target?.split('-')[0];
          if (routeName) {
            navigationService.updateCurrentRoute(routeName);
          }
        },
      }}
    >
      <Tab.Screen 
        name="Wardrobe" 
        component={WardrobeScreen} 
        options={{ title: 'Guarda-roupa' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{ title: 'Descobrir' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ title: 'Adicionar' }}
      />
      <Tab.Screen 
        name="Marketplace" 
        component={MarketplaceScreen} 
        options={{ title: 'Marketplace' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    setupNavigation();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!authToken);
      console.log('🔧 Mobile App: Auth status checked', { isAuthenticated: !!authToken });
    } catch (error) {
      console.error('❌ Mobile App: Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNavigation = () => {
    // Setup navigation state listener
    navigationService.setupNavigationStateListener();
    
    // Load saved navigation state
    navigationService.loadNavigationState();
    
    console.log('✅ Mobile App: Navigation setup complete');
  };

  const handleNavigationStateChange = (state: any) => {
    // Update navigation service when navigation state changes
    if (state) {
      const currentRoute = getCurrentRouteName(state);
      if (currentRoute) {
        navigationService.updateCurrentRoute(currentRoute);
      }
    }
  };

  const getCurrentRouteName = (state: any): string | null => {
    if (!state) return null;

    const route = state.routes[state.index];
    if (route.state) {
      return getCurrentRouteName(route.state);
    }

    return route.name;
  };

  if (isLoading) {
    return null; // You could show a splash screen here
  }

  return (
    <DataProvider>
      <NavigationContainer 
        ref={navigationRef}
        onStateChange={handleNavigationStateChange}
        onReady={() => {
          console.log('✅ Mobile App: Navigation container ready');
        }}
      >
        <StatusBar style="light" backgroundColor="#00132d" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
}