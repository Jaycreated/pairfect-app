import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PoppinsText } from '../PoppinsText';

interface PhotoUploadProps {
  onPhotosSelected: (photoUris: string[]) => void;
  onContinue: () => void;
}

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

export const PhotoUpload = ({ onPhotosSelected, onContinue }: PhotoUploadProps) => {
  const [photos, setPhotos] = useState<string[]>(['', '']);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const newPhotos = [...photos];
        newPhotos[index] = result.assets[0].uri;
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    const fileName = uri.split('/').pop();
    const fileType = fileName?.split('.').pop();

    formData.append('file', {
      uri,
      name: `photo-${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || '');

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    return data.secure_url;
  };

  const handleContinue = async () => {
    if (photos.filter(photo => photo).length === 0) {
      Alert.alert('Please add at least one photo');
      return;
    }

    try {
      setUploading(true);
      const uploadedPhotos = await Promise.all(
        photos.filter(photo => photo).map(photo => uploadImage(photo))
      );
      
      // Save photo URLs to storage
      await Storage.setItem('userPhotos', JSON.stringify(uploadedPhotos));
      
      onPhotosSelected(uploadedPhotos);
      onContinue();
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <PoppinsText style={styles.title}>Add Your Photos</PoppinsText>
      <PoppinsText style={styles.subtitle}>Add at least one photo to continue</PoppinsText>
      
      <View style={styles.photosContainer}>
        {[0, 1].map((index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoContainer}
            onPress={() => pickImage(index)}
            disabled={uploading}
          >
            {photos[index] ? (
              <Image source={{ uri: photos[index] }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color="#666" />
              </View>
            )}
            <PoppinsText style={styles.photoLabel}>
              {index === 0 ? 'Main Photo' : 'Additional Photo'}
            </PoppinsText>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, uploading && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <PoppinsText style={styles.continueButtonText}>
            Continue
          </PoppinsText>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  photoContainer: {
    alignItems: 'center',
    width: '48%',
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 2/3,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photo: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 14,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
