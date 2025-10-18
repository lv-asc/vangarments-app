import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../context/DataContext';

export default function CameraScreen() {
  const { addWardrobeItem } = useData();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      // Mock AI-detected item data
      const mockDetectedItem = {
        name: 'AI-Detected Fashion Item',
        category: 'Tops',
        subcategory: 'T-Shirts',
        brand: 'Unknown Brand',
        color: 'Blue',
        size: 'M',
        image: selectedImage,
        description: 'Item detected and cataloged using AI recognition',
        condition: 'good' as const,
        tags: ['ai-detected', 'new-item']
      };

      addWardrobeItem(mockDetectedItem);
      setIsProcessing(false);
      setSelectedImage(null);
      
      Alert.alert(
        'Item Added!',
        'Your item has been successfully added to your wardrobe with AI-detected properties.',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const quickAddSample = () => {
    const sampleItems = [
      {
        name: 'Casual Blue Jeans',
        category: 'Bottoms',
        subcategory: 'Jeans',
        brand: 'Levi\'s',
        color: 'Blue',
        size: '32',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
        description: 'Classic blue jeans perfect for everyday wear',
        condition: 'good' as const,
        tags: ['casual', 'denim', 'everyday']
      },
      {
        name: 'White Sneakers',
        category: 'Shoes',
        subcategory: 'Sneakers',
        brand: 'Adidas',
        color: 'White',
        size: '9',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop',
        description: 'Clean white sneakers for a fresh look',
        condition: 'excellent' as const,
        tags: ['sporty', 'comfortable', 'versatile']
      },
      {
        name: 'Black Blazer',
        category: 'Outerwear',
        subcategory: 'Blazers',
        brand: 'Zara',
        color: 'Black',
        size: 'M',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
        description: 'Professional black blazer for formal occasions',
        condition: 'excellent' as const,
        tags: ['formal', 'professional', 'elegant']
      }
    ];

    const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    addWardrobeItem(randomItem);
    
    Alert.alert('Sample Item Added!', `${randomItem.name} has been added to your wardrobe.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Item</Text>
        <Text style={styles.subtitle}>Capture or select photos of your fashion items</Text>
      </View>

      {/* Camera Actions */}
      <View style={styles.cameraSection}>
        <View style={styles.cameraButtons}>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Ionicons name="camera" size={32} color="#fff7d7" />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Ionicons name="images" size={32} color="#fff7d7" />
            <Text style={styles.cameraButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
                <Text style={styles.retakeButtonText}>Remove</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
                onPress={processImage}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Ionicons name="sync" size={20} color="#fff7d7" />
                    <Text style={styles.processButtonText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff7d7" />
                    <Text style={styles.processButtonText}>Add to Wardrobe</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* AI Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>AI-Powered Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="eye" size={24} color="#00132d" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Recognition</Text>
              <Text style={styles.featureDescription}>
                Automatically detect item type, color, and style
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="cut" size={24} color="#00132d" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Background Removal</Text>
              <Text style={styles.featureDescription}>
                Clean up your photos with automatic background removal
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="pricetag" size={24} color="#00132d" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Tagging</Text>
              <Text style={styles.featureDescription}>
                Get suggested tags and categories for better organization
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Add Demo */}
      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Quick Demo</Text>
        <Text style={styles.demoDescription}>
          Try adding a sample item to see how the app works
        </Text>
        <TouchableOpacity style={styles.demoButton} onPress={quickAddSample}>
          <Ionicons name="flash" size={20} color="#00132d" />
          <Text style={styles.demoButtonText}>Add Sample Item</Text>
        </TouchableOpacity>
      </View>

      {/* Photography Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Photography Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="sunny" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Use natural lighting when possible</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="square" size={16} color="#3B82F6" />
            <Text style={styles.tipText}>Place items on a flat, clean surface</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="resize" size={16} color="#10B981" />
            <Text style={styles.tipText}>Fill the frame with your item</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="camera-reverse" size={16} color="#8B5CF6" />
            <Text style={styles.tipText}>Take both front and back photos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cameraSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cameraButton: {
    backgroundColor: '#00132d',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.45,
  },
  cameraButtonText: {
    color: '#fff7d7',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00132d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  processButtonDisabled: {
    opacity: 0.6,
  },
  processButtonText: {
    color: '#fff7d7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  demoSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
    alignItems: 'center',
  },
  demoDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7d7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00132d',
  },
  demoButtonText: {
    color: '#00132d',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});