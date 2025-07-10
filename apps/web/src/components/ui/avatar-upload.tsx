'use client';

import type { AvatarUploadProps } from '@/types';
import imageCompression from 'browser-image-compression';
import { Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';

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

  // Convex連携は廃止。アップロード後はブラウザ内Blob URLを返す

  const uploadLocally = useCallback(async (file: File) => {
    // Object URL を生成して返す
    const objectUrl = URL.createObjectURL(file);
    return { url: objectUrl };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const [file] = acceptedFiles;
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

        // Update preview for immediate feedback
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

        // Upload locally (generate object URL)
        const result = await uploadLocally(compressedFile);

        // Notify parent component with local URL
        onUpload({ url: result.url });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
        setPreview(avatarUrl ?? null);
      } finally {
        setIsUploading(false);
      }
    },
    [avatarUrl, maxSize, onUpload, uploadLocally]
  );

  // コンポーネントアンマウント時にObject URLを解放
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

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
    <div className={`space-y-3 ${className}`}>
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
          <div className='flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin mr-2' />
            <span className='text-sm'>アップロード中...</span>
          </div>
        ) : isDragActive ? (
          <p className='text-sm'>ここにドロップしてください</p>
        ) : (
          <div>
            <Upload className='h-6 w-6 mx-auto mb-2 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              クリックまたはドラッグ&ドロップで画像をアップロード
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              最大{maxSize}MB（JPEG, PNG, GIF, WebP）
            </p>
          </div>
        )}
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      {onRemove && !isUploading && (avatarUrl ?? preview) && (
        <Button
          variant='outline'
          size='sm'
          onClick={handleRemove}
          className='w-full'
          disabled={disabled}
        >
          <X className='h-4 w-4 mr-1' />
          画像を削除
        </Button>
      )}
    </div>
  );
}
