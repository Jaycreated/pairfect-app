if (!process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 
    !process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
  throw new Error('Missing required Cloudinary environment variables');
}

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
} as const;

export const uploadToCloudinary = async (uri: string): Promise<string> => {
  console.log('📤 [Cloudinary] Starting image upload');
  
  const formData = new FormData();
  
  // @ts-ignore - FormData type definition is not perfect for React Native
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  });
  
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
  formData.append('folder', 'pairfect/profile_photos');

  try {
    console.log('📤 [Cloudinary] Sending request to Cloudinary');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = await response.json();
    
    if (result.error) {
      console.error('❌ [Cloudinary] Upload error:', result.error);
      throw new Error(result.error.message || 'Failed to upload image');
    }

    console.log('✅ [Cloudinary] Image uploaded successfully:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ [Cloudinary] Upload failed:', error);
    throw error;
  }
};
