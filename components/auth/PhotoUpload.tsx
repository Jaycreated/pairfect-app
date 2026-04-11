import { useToast } from '@/context/ToastContext';
import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PoppinsText } from '../PoppinsText';

interface PhotoUploadProps {
  onPhotosSelected: (photoUris: string[]) => void;
  onContinue: () => void;
}

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

export const PhotoUpload = ({ onPhotosSelected, onContinue }: PhotoUploadProps) => {
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<string[]>(['', '']);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (index: number) => {
    try {
      // Suppress permission logs
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        if (!(typeof args[0] === 'string' && args[0].includes('Image Picker'))) {
          originalConsoleLog(...args);
        }
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      // Restore original console.log
      console.log = originalConsoleLog;

      if (!result.canceled && result.assets?.[0]?.uri) {
        const newPhotos = [...photos];
        newPhotos[index] = result.assets[0].uri;
        setPhotos(newPhotos);
        onPhotosSelected(newPhotos.filter(photo => photo !== ''));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick image. Please try again.', 'error');
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

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = '';
    setPhotos(newPhotos);
    onPhotosSelected(newPhotos.filter(photo => photo !== ''));
  };

  const handleContinue = async () => {
    if (photos.filter(photo => photo).length === 0) {
      showToast('Please add at least one photo', 'error');
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
      showToast('Failed to upload photos. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <PoppinsText style={styles.title}>Add Your Photos</PoppinsText>
        <PoppinsText style={styles.subtitle}>Add at least one photo to show others who you are</PoppinsText>
      </View>
      
      <View style={styles.photosContainer}>
        {[0, 1].map((index) => (
          <View key={index} style={styles.photoWrapper}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => pickImage(index)}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {photos[index] ? (
                <>
                  <Image source={{ uri: photos[index] }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePhoto(index)}
                    disabled={uploading}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF6B6B" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={styles.cameraIconContainer}>
                    <Ionicons name="camera" size={40} color="#651B55" />
                  </View>
                  <PoppinsText style={styles.tapText}>Tap to upload</PoppinsText>
                </View>
              )}
            </TouchableOpacity>
            <PoppinsText style={styles.photoLabel}>
              {index === 0 ? 'Main Photo' : 'Additional Photo'}
            </PoppinsText>
            {index === 0 && (
              <PoppinsText style={styles.requiredText}>Required</PoppinsText>
            )}
          </View>
        ))}
      </View>

      <View style={styles.bottomContainer}>
        <PoppinsText style={styles.hintText}>
          💡 Tip: Choose clear, well-lit photos of yourself
        </PoppinsText>
        
        <TouchableOpacity
          style={[styles.continueButton, uploading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <PoppinsText style={styles.uploadingText}>Uploading...</PoppinsText>
            </View>
          ) : (
            <PoppinsText style={styles.continueButtonText}>
              Continue
            </PoppinsText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    minHeight: '100%',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#651B55',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  photoWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E6F4FE',
    borderStyle: 'dashed',
  },
  cameraIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tapText: {
    fontSize: 13,
    color: '#651B55',
    fontWeight: '500',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoLabel: {
    fontSize: 15,
    color: '#333',
    marginTop: 12,
    fontWeight: '500',
  },
  requiredText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingTop: 40,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
