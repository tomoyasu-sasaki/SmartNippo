import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
  Text,
  Modal,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera, ImageIcon, X } from 'lucide-react-native';

interface AvatarPickerProps {
  currentAvatarUrl?: string;
  onImageSelected: (result: {
    uri: string;
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    fileName?: string;
  }) => void;
  size?: number;
  disabled?: boolean;
}

export default function AvatarPicker({
  currentAvatarUrl,
  onImageSelected,
  size = 120,
  disabled = false,
}: AvatarPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
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

      const result = {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        fileSize: blob.size,
        mimeType: 'image/jpeg',
        fileName: `avatar_${Date.now()}.jpg`,
      };

      onImageSelected(result);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('エラー', '画像の処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
      setModalVisible(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const { libraryStatus } = await requestPermissions();

    if (libraryStatus !== 'granted') {
      Alert.alert(
        '権限が必要です',
        'フォトライブラリへのアクセス権限が必要です。設定で許可してください。'
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
        '権限が必要です',
        'カメラへのアクセス権限が必要です。設定で許可してください。'
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
      'アバター画像を選択',
      '写真の選択方法を選んでください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'フォトライブラリ', onPress: pickImageFromLibrary },
        { text: 'カメラで撮影', onPress: takePhotoWithCamera },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.avatarContainer,
          { width: size, height: size },
          disabled && styles.disabled,
        ]}
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
            <ImageIcon size={size * 0.4} color="#9CA3AF" />
          </View>
        )}

        {!disabled && (
          <View style={styles.editBadge}>
            <Camera size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {processing && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>処理中...</Text>
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
});
