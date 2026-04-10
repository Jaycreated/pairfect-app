import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request media library permission in a way that works across Expo and bare RN on Android
 * Returns an object with a `status` string: 'granted' | 'denied' | 'undetermined'
 */
export const requestMediaPermission = async (): Promise<{ status: 'granted' | 'denied' | 'undetermined' }> => {
  if (Platform.OS === 'web') {
    return { status: 'granted' };
  }

  try {
    if (Platform.OS === 'ios') {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return { status: res.status === 'granted' ? 'granted' : 'denied' };
    }
    
    // For Android 13+ (API 33+), we need to request READ_MEDIA_IMAGES
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const readMediaImages = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      
      if (readMediaImages === PermissionsAndroid.RESULTS.GRANTED) {
        return { status: 'granted' };
      }
      
      // Also check if we have legacy READ_EXTERNAL_STORAGE for older files
      const readStorage = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      
      return { 
        status: readStorage === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied' 
      };
    }

    // Android: attempt to request runtime permission for external storage
    // On older Android versions we need READ_EXTERNAL_STORAGE
    // On Android 13+ apps should request READ_MEDIA_IMAGES, but PermissionsAndroid may not expose it on older RN versions
    const androidPerms: string[] = [];

    // Try to include READ_MEDIA_IMAGES if available (API 33+)
    const READ_MEDIA_IMAGES = (PermissionsAndroid as any).PERMISSIONS?.READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES';
    androidPerms.push(READ_MEDIA_IMAGES);
    androidPerms.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);

    for (const perm of androidPerms) {
      try {
        const result = await PermissionsAndroid.request(perm as any);
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return { status: 'granted' };
        }
      } catch (err) {
        // ignore and try next
      }
    }

    // Fallback: try expo-image-picker request (useful in managed workflow)
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return { status: res.status === 'granted' ? 'granted' : 'denied' };
  } catch (error) {
    console.warn('requestMediaPermission error', error);
    return { status: 'undetermined' };
  }
};
