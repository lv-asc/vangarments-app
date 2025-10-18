import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';

export default function ProfileScreen() {
  const { userProfile, wardrobeItems, updateUserProfile, isLoading } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
  });

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        bio: userProfile.bio || '',
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => {
    if (userProfile) {
      updateUserProfile({
        name: editForm.name,
        bio: editForm.bio,
      });
      setIsEditing(false);
      Alert.alert('Profile Updated!', 'Your profile has been successfully updated.');
    }
  };

  const handleImageUpload = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    ];
    
    const currentIndex = sampleImages.findIndex(img => img === userProfile?.profileImage);
    const nextIndex = (currentIndex + 1) % sampleImages.length;
    const newImage = sampleImages[nextIndex];
    
    updateUserProfile({ profileImage: newImage });
    Alert.alert('Profile Photo Updated!', 'Your profile photo has been changed.');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00132d" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Profile Not Found</Text>
          <Text style={styles.emptySubtitle}>Please log in to access your profile.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {userProfile.profileImage ? (
            <Image source={{ uri: userProfile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userProfile.name?.charAt(0) || 'U'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.cameraButton} onPress={handleImageUpload}>
            <Ionicons name="camera" size={16} color="#fff7d7" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.nameInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.bioInput}
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{userProfile.name}</Text>
                <TouchableOpacity onPress={handleEditProfile}>
                  <Ionicons name="pencil" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.username}>@{userProfile.username}</Text>
              <Text style={styles.email}>{userProfile.email}</Text>
              {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
              <Text style={styles.joinDate}>
                Joined {new Date(userProfile.createdAt).toLocaleDateString()}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userProfile.stats.wardrobeItems}</Text>
          <Text style={styles.statLabel}>Wardrobe Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userProfile.stats.outfitsCreated}</Text>
          <Text style={styles.statLabel}>Outfits Created</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userProfile.stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userProfile.stats.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Recent Wardrobe Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {wardrobeItems.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
            {wardrobeItems.slice(0, 6).map((item) => (
              <View key={item.id} style={styles.recentItem}>
                <Image source={{ uri: item.image }} style={styles.recentItemImage} />
                <Text style={styles.recentItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.recentItemBrand}>{item.brand}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>No wardrobe items yet</Text>
          </View>
        )}
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
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
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00132d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#fff7d7',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00132d',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  joinDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  editForm: {
    width: '100%',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#00132d',
    paddingVertical: 8,
    marginBottom: 16,
    textAlign: 'center',
    minWidth: 200,
  },
  bioInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    minHeight: 80,
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#00132d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff7d7',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00132d',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
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
  },
  viewAllText: {
    fontSize: 14,
    color: '#00132d',
    fontWeight: '500',
  },
  itemsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recentItem: {
    width: 100,
    marginRight: 12,
  },
  recentItemImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  recentItemBrand: {
    fontSize: 10,
    color: '#6B7280',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
});