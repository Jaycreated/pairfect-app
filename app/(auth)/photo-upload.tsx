import { PhotoUpload } from '@/components/auth/PhotoUpload';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function PhotoUploadScreen() {
  const router = useRouter();

  const handlePhotosSelected = (photoUris: string[]) => {
    console.log('Photos uploaded:', photoUris);
    // You can save the photo URLs to your backend here
  };

  const handleContinue = () => {
    // Navigate to the swipe page after photos are uploaded
    router.replace('/(tabs)/swipe');
  };

  return (
    <View style={{ flex: 1 }}>
      <PhotoUpload 
        onPhotosSelected={handlePhotosSelected}
        onContinue={handleContinue}
      />
    </View>
  );
}
