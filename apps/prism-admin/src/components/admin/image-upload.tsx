"use client";

/**
 * Image Upload Component
 *
 * File upload for Supabase Storage buckets with drag-and-drop support.
 * Supports JPEG, PNG, WebP, SVG up to 50MB.
 */

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadToStorage, deleteFromStorage } from "@/app/actions/storage";

// =============================================================================
// TYPES
// =============================================================================

interface ImageUploadProps {
  bucket: "services" | "works_catalog" | "community_posts";
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onDelete?: () => void;
  className?: string;
  label?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  onDelete,
  className = "",
  label = "Upload Image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);

      try {
        const result = await uploadToStorage(file, bucket);

        if (result.success && result.url) {
          setPreview(result.url);
          onUpload(result.url);
        } else {
          setError(result.error || "Upload failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, onUpload]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDelete = async () => {
    if (!preview) return;

    setDeleting(true);
    try {
      // Extract path from URL
      const urlParts = preview.split("/");
      const path = urlParts.slice(urlParts.indexOf(bucket) + 1).join("/");

      const result = await deleteFromStorage(bucket, path);

      if (result.success) {
        setPreview(null);
        onDelete?.();
      } else {
        setError(result.error || "Delete failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>

      {preview ? (
        <div className="relative rounded-lg border border-white/10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded bg-black/60 text-white/80 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-white/10 hover:border-white/20"
          } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={onFileChange}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              <p className="text-sm text-white/60">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/60">
                {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-white/30">JPEG, PNG, WebP, SVG up to 50MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
