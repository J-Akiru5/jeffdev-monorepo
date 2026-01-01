'use client';

/**
 * Case Study Image Upload Component
 * -----------------------------------
 * Drag & drop image upload using R2 storage.
 * Shows preview and allows deletion.
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@/app/actions/upload';

interface Props {
  currentImage: string | null;
  onImageChange: (url: string | null) => void;
}

export function CaseStudyImageUpload({ currentImage, onImageChange }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      // Validate type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return;
      }

      setIsUploading(true);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload via server action
        const result = await uploadFile(formData);

        if (result.success && result.url) {
          setPreview(result.url);
          onImageChange(result.url);
          toast.success('Image uploaded');
        } else {
          toast.error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    },
    [onImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">
        Cover Image
      </label>

      {preview ? (
        // Preview State
        <div className="relative overflow-hidden rounded-md border border-white/10">
          <img
            src={preview}
            alt="Case study cover"
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Upload Zone
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 transition-colors ${
            isDragActive
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <p className="mt-2 text-sm text-white/50">Uploading...</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-10 w-10 text-cyan-400" />
              <p className="mt-2 text-sm text-white/70">Drop the image here</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-white/30" />
              <p className="mt-2 text-sm text-white/50">
                Drag & drop an image, or click to select
              </p>
              <p className="mt-1 text-xs text-white/30">
                JPG, PNG, WebP • Max 10MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
