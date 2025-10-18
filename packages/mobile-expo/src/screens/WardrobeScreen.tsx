import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 columns with padding

export default function WardrobeScreen() {
  const { wardrobeItems, addWardrobeItem, isLoading } = useData();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const handleAddItem = () => {
    const sampleItems = [
      {
        name: 'Striped Cotton T-Shirt',
        category: 'Tops',
        subcategory: 'T-Shirts',
        brand: 'Uniqlo',
        color: 'Navy/White',
        size: 'M',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
        description: 'Comfortable striped cotton t-shirt perfect for casual wear',
        price: 19.99,
        condition: 'new' as const,
        tags: ['casual', 'comfortable', 'everyday']
      },
      {
        name: 'Denim Jacket',
        category: 'Outerwear',
        subcategory: 'Jackets',
        brand: 'Levi\'s',
        color: 'Blue',
        size: 'M',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop',
        description: 'Classic denim jacket for layering',
        price: 79.99,
        condition: 'excellent' as const,
        tags: ['classic', 'versatile', 'denim']
      },
      {
        name: 'Summer Floral Dress',
        category: 'Dresses',
        subcategory: 'Summer Dresses',
        brand: 'Zara',
        color: 'Pink Floral',
        size: 'S',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop',
        description: 'Light and airy summer dress with beautiful floral pattern',
        price: 45.99,
        condition: 'good' as const,
        tags: ['summer', 'feminine', 'floral']
      }
    ];
    
    const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    addWardrobeItem(randomItem);
    
    Alert.alert('Item Added!', `${randomItem.name} has been added to your wardrobe.`);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return '#10B981';
      case 'excellent': return '#3B82F6';
      case 'good': return '#F59E0B';
      case 'fair': return '#F97316';
      default: return '#EF4444';
    }
  };

  const renderWardrobeItem = ({ item }: { item: any }) => (
    <View style={[styles.itemCard, { width: itemWidth }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons
            name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={favorites.has(item.id) ? '#EF4444' : '#6B7280'}
          />
        </TouchableOpacity>

        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) }]}>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemDetails}>{item.category} • {item.size}</Text>
        <Text style={styles.itemColor}>{item.color}</Text>
        {item.price && (
          <Text style={styles.itemPrice}>${item.price}</Text>
        )}
        
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 2).map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 2 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{item.tags.length - 2}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00132d" />
        <Text style={styles.loadingText}>Loading your wardrobe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Wardrobe</Text>
          <Text style={styles.subtitle}>{wardrobeItems.length} items in your collection</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color="#fff7d7" />
        </TouchableOpacity>
      </View>

      {wardrobeItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Start Your Digital Wardrobe</Text>
          <Text style={styles.emptySubtitle}>
            Add your first items to begin organizing and discovering new combinations.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddItem}>
            <Text style={styles.primaryButtonText}>Add Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wardrobeItems}
          renderItem={renderWardrobeItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#00132d',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#00132d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff7d7',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00132d',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemColor: {
    fontSize: 12,
    color: '#00132d',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#fff7d7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#00132d',
    fontWeight: '500',
  },
});