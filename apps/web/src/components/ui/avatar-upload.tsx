'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';

interface AvatarUploadProps {
  avatarUrl?: string;
  onUpload: (result: { url: string; storageId?: string; fileSize: number; fileType: string }) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSize?: number;
  className?: string;
}

export function AvatarUpload({
  avatarUrl,
  onUpload,
  onRemove,
  disabled = false,
  maxSize = 5,
  className = '',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const generateUploadUrl = useMutation(api.uploads.generateAvatarUploadUrl);
  const saveAvatarToProfile = useMutation(api.uploads.saveAvatarToProfile);

  const uploadToConvex = async (file: File): Promise<{ url: string; storageId: string }> => {
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await response.json();

      // Save to profile and get URL
      const result = await saveAvatarToProfile({
        storageId,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      });

      if (!result?.url) {
        throw new Error("Failed to get URL from saveAvatarToProfile");
      }

      return { url: result.url, storageId };
    } catch (error) {
      console.error('Convex upload error:', error);
      throw new Error('Failed to upload to server');
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {return;}

      const file = acceptedFiles[0];
      setError(null);
      setIsUploading(true);

      try {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`ファイルサイズは${maxSize}MB以下にしてください`);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('画像ファイルを選択してください');
        }

        // Compress image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 500,
          useWebWorker: true,
          fileType: 'image/webp' as const,
        };

        const compressedFile = await imageCompression(file, options);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

        // Upload to Convex
        const { url, storageId } = await uploadToConvex(compressedFile);

        // Notify parent component
        onUpload({
          url,
          storageId,
          fileSize: compressedFile.size,
          fileType: compressedFile.type
        });
        setError(null);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
        setPreview(avatarUrl ?? null);
      } finally {
        setIsUploading(false);
      }
    },
    [avatarUrl, maxSize, onUpload, generateUploadUrl, saveAvatarToProfile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove?.();
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Avatar className="h-24 w-24">
        {preview ? (
          <AvatarImage src={preview} alt="Avatar" />
        ) : (
          <AvatarFallback>
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">アップロード中...</span>
            </div>
          ) : isDragActive ? (
            <p className="text-sm">ここにドロップしてください</p>
          ) : (
            <div>
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                クリックまたはドラッグ&ドロップで画像をアップロード
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                最大{maxSize}MB（JPEG, PNG, GIF, WebP）
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}

        {preview && onRemove && !isUploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="mt-2"
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            画像を削除
          </Button>
        )}
      </div>
    </div>
  );
}
