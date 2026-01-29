import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

// Mock discover data

const mockCategories = [
  { id: '1', name: 'Trending', icon: 'trending-up', color: '#EF4444' },
  { id: '2', name: 'Casual', icon: 'shirt', color: '#3B82F6' },
  { id: '3', name: 'Formal', icon: 'business', color: '#8B5CF6' },
  { id: '4', name: 'Seasonal', icon: 'leaf', color: '#10B981' },
  { id: '5', name: 'Vintage', icon: 'time', color: '#F59E0B' },
  { id: '6', name: 'Sporty', icon: 'fitness', color: '#06B6D4' },
];

const mockInfluencers = [
  {
    id: '1',
    name: 'Fashion Guru',
    username: 'fashionguru',
    followers: '125K',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Style Maven',
    username: 'stylemaven',
    followers: '89K',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Trend Setter',
    username: 'trendsetter',
    followers: '203K',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    isFollowing: false,
  },
];

export default function DiscoverScreen() {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set(['2']));

  const toggleLike = (itemId: string) => {
    const newLikedItems = new Set(likedItems);
    if (newLikedItems.has(itemId)) {
      newLikedItems.delete(itemId);
    } else {
      newLikedItems.add(itemId);
    }
    setLikedItems(newLikedItems);
  };

  const toggleFollow = (userId: string) => {
    const newFollowedUsers = new Set(followedUsers);
    if (newFollowedUsers.has(userId)) {
      newFollowedUsers.delete(userId);
    } else {
      newFollowedUsers.add(userId);
    }
    setFollowedUsers(newFollowedUsers);
  };


  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderInfluencer = ({ item }: { item: any }) => (
    <View style={styles.influencerCard}>
      <Image source={{ uri: item.avatar }} style={styles.influencerAvatar} />
      <View style={styles.influencerInfo}>
        <Text style={styles.influencerName}>{item.name}</Text>
        <Text style={styles.influencerUsername}>@{item.username}</Text>
        <Text style={styles.influencerFollowers}>{item.followers} followers</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          followedUsers.has(item.id) && styles.followButtonActive
        ]}
        onPress={() => toggleFollow(item.id)}
      >
        <Text
          style={[
            styles.followButtonText,
            followedUsers.has(item.id) && styles.followButtonTextActive
          ]}
        >
          {followedUsers.has(item.id) ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Explore trends and get inspired</Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <FlatList
          data={mockCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>


      {/* Featured Influencers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Creators</Text>
        <View style={styles.influencersContainer}>
          {mockInfluencers.map((influencer) => (
            <View key={influencer.id}>
              {renderInfluencer({ item: influencer })}
            </View>
          ))}
        </View>
      </View>

      {/* Style Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <Ionicons name="color-palette" size={24} color="#00132d" />
            <Text style={styles.tipTitle}>Color Coordination</Text>
            <Text style={styles.tipDescription}>
              Learn how to match colors that complement your skin tone
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="resize" size={24} color="#00132d" />
            <Text style={styles.tipTitle}>Perfect Fit</Text>
            <Text style={styles.tipDescription}>
              Discover how proper fit can transform any look
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="layers" size={24} color="#00132d" />
            <Text style={styles.tipTitle}>Layering Basics</Text>
            <Text style={styles.tipDescription}>
              Master the art of layering for versatile looks
            </Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00132d',
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 0,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  influencersContainer: {
    gap: 12,
  },
  influencerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  influencerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  influencerInfo: {
    flex: 1,
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  influencerUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  influencerFollowers: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  followButton: {
    backgroundColor: '#00132d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonActive: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    color: '#fff7d7',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#374151',
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});