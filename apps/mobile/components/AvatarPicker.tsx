import { COMPONENT_CONSTANTS } from '@smartnippo/lib';
import type { AvatarPickerProps, ImageResult } from '@smartnippo/types';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AvatarPicker({
  currentAvatarUrl,
  onImageSelected,
  size = 120,
  disabled = false,
}: AvatarPickerProps) {
  const [processing, setProcessing] = useState(false);

  // 画像処理設定
  const IMAGE_SETTINGS = {
    quality: 0.8,
    maxWidth: 500,
    maxHeight: 500,
    format: ImageManipulator.SaveFormat.JPEG,
  } as const;

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return { cameraStatus, libraryStatus };
  };

  const processImage = async (uri: string) => {
    try {
      setProcessing(true);

      // 画像をリサイズ・圧縮
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: IMAGE_SETTINGS.maxWidth,
              height: IMAGE_SETTINGS.maxHeight,
            },
          },
        ],
        {
          compress: IMAGE_SETTINGS.quality,
          format: IMAGE_SETTINGS.format,
        }
      );

      // ファイル情報を取得
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      const result: ImageResult = {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        fileSize: blob.size,
        mimeType: 'image/jpeg',
        fileName: `avatar_${Date.now()}.jpg`,
      };

      onImageSelected(result);
    } catch {
      Alert.alert(
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.ERROR_TITLE,
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.ERROR_MESSAGE
      );
    } finally {
      setProcessing(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const { libraryStatus } = await requestPermissions();

    if (libraryStatus !== 'granted') {
      Alert.alert(
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.PERMISSION_LIBRARY_TITLE,
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.PERMISSION_LIBRARY_MESSAGE
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // 正方形にクロップ
      quality: 1,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const { cameraStatus } = await requestPermissions();

    if (cameraStatus !== 'granted') {
      Alert.alert(
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.PERMISSION_CAMERA_TITLE,
        COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.PERMISSION_CAMERA_MESSAGE
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // 正方形にクロップ
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.SELECT_TITLE,
      COMPONENT_CONSTANTS.AVATAR_PICKER.ALERTS.SELECT_MESSAGE,
      [
        { text: COMPONENT_CONSTANTS.AVATAR_PICKER.BUTTONS.CANCEL, style: 'cancel' },
        {
          text: COMPONENT_CONSTANTS.AVATAR_PICKER.BUTTONS.PHOTO_LIBRARY,
          onPress: pickImageFromLibrary,
        },
        { text: COMPONENT_CONSTANTS.AVATAR_PICKER.BUTTONS.CAMERA, onPress: takePhotoWithCamera },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }, disabled && styles.disabled]}
        onPress={showImagePicker}
        disabled={disabled || processing}
      >
        {currentAvatarUrl ? (
          <Image
            source={{ uri: currentAvatarUrl }}
            style={[styles.avatar, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <User size={size * 0.4} color='#9CA3AF' />
          </View>
        )}
        <View style={styles.iconContainer}>
          <Camera size={16} color='white' />
        </View>
      </TouchableOpacity>

      {processing && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>
            {COMPONENT_CONSTANTS.AVATAR_PICKER.PROCESSING_TEXT}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatar: {
    borderRadius: 9999,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  disabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  iconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

// Skeleton Loading Components
export function ReportCardSkeleton() {
  return (
    <View className='mb-4 rounded-lg bg-white p-4 shadow-sm'>
      {/* Header skeleton */}
      <View className='mb-2 flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <View className='h-4 w-4 rounded bg-gray-200' />
          <View className='ml-1 h-4 w-20 rounded bg-gray-200' />
        </View>
        <View className='h-6 w-16 rounded-full bg-gray-200' />
      </View>

      {/* Title skeleton */}
      <View className='mb-2 h-5 w-3/4 rounded bg-gray-200' />

      {/* Content skeleton */}
      <View className='mb-3 space-y-1'>
        <View className='h-4 w-full rounded bg-gray-200' />
        <View className='h-4 w-5/6 rounded bg-gray-200' />
        <View className='h-4 w-2/3 rounded bg-gray-200' />
      </View>

      {/* Footer skeleton */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <View className='h-3 w-3 rounded bg-gray-200' />
          <View className='ml-1 h-3 w-16 rounded bg-gray-200' />
        </View>
        <View className='flex-row items-center'>
          <View className='h-3 w-3 rounded bg-gray-200' />
          <View className='ml-1 h-3 w-12 rounded bg-gray-200' />
        </View>
      </View>
    </View>
  );
}

export function ReportListSkeleton() {
  return (
    <View className='p-4'>
      {Array.from({ length: 5 }).map((_, index) => (
        <ReportCardSkeleton key={index} />
      ))}
    </View>
  );
}
