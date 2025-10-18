import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const handlePress = () => {
    Alert.alert('Success!', 'Vangarments mobile app is working!');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#00132d" />
      
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.title}>Vangarments</Text>
        <Text style={styles.subtitle}>Fashion Platform</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to Vangarments Mobile!</Text>
        <Text style={styles.description}>
          Your digital fashion platform is now running on iOS simulator.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>Test App</Text>
        </TouchableOpacity>
        
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.featureItem}>• Digital Wardrobe</Text>
          <Text style={styles.featureItem}>• Fashion Marketplace</Text>
          <Text style={styles.featureItem}>• Style Discovery</Text>
          <Text style={styles.featureItem}>• Social Sharing</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#00132d',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#fff7d7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#00132d',
    fontSize: 36,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff7d7',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#fff7d7',
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#00132d',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff7d7',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
});