"use client";

/**
 * ImageUpload
 * -----------
 * Global image upload component for Supabase Storage (or any backend).
 * Storage-agnostic — consuming apps provide their own upload/delete callbacks.
 *
 * Features:
 * - Drag-and-drop zone (HTML5, no extra deps)
 * - Preview for existing images
 * - Replace & remove buttons
 * - Loading, error, and drag-active states
 * - File type & size validation
 */

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageUploadProps {
  /** Current image URL to display (if any) */
  currentImage?: string | null;
  /** Called when a file should be uploaded. Return the public URL or error. */
  onUpload: (file: File) => Promise<{ url: string; error?: string }>;
  /** Called when the current image should be removed. */
  onRemove?: () => Promise<{ success: boolean; error?: string }>;
  /** Label text above the upload area. */
  label?: string;
  /** Extra class names. */
  className?: string;
  /** Accepted MIME types. Default: image/jpeg, image/png, image/webp. */
  accept?: string;
  /** Maximum file size in bytes. Default: 10MB. */
  maxSize?: number;
  /** Override the hint text shown below the upload zone. */
  hint?: string;
  /** Height of the preview container. Default: "h-48". */
  previewHeight?: string;
}

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp";
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Component ───────────────────────────────────────────────────────────────

export function ImageUpload({
  currentImage,
  onUpload,
  onRemove,
  label = "Image",
  className = "",
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  hint,
  previewHeight = "h-48",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate type
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      if (!acceptedTypes.includes(file.type) && !file.type.startsWith("image/")) {
        setError(
          `Invalid file type. Accepted: ${acceptedTypes.join(", ").replace(/image\//g, "")}.`,
        );
        return;
      }

      // Validate size
      if (file.size > maxSize) {
        const mb = Math.round(maxSize / 1024 / 1024);
        setError(`File too large. Maximum size is ${mb}MB.`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const result = await onUpload(file);
        if (result.error) {
          setError(result.error);
        } else {
          setPreview(result.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [accept, maxSize, onUpload],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(async () => {
    if (!onRemove) {
      // Just clear local state if no remove callback
      setPreview(null);
      setError(null);
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      const result = await onRemove();
      if (result.error) {
        setError(result.error);
      } else {
        setPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoving(false);
    }
  }, [onRemove]);

  // ── Render ──

  const mimeSummary = accept
    .split(",")
    .map((t) => t.trim().replace("image/", "").toUpperCase())
    .join(", ");
  const sizeMb = Math.round(maxSize / 1024 / 1024);

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
        {label}
      </label>

      {preview ? (
        /* ── Preview state ── */
        <div className={`relative overflow-hidden rounded-lg border border-white/10 ${previewHeight}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-1.5">
            {/* Replace button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className="rounded-md bg-black/60 p-1.5 text-white/80 transition-colors hover:bg-black/80 hover:text-cyan-400 disabled:opacity-50"
              title="Replace image"
            >
              <Upload className="h-4 w-4" />
            </button>
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="rounded-md bg-black/60 p-1.5 text-white/80 transition-colors hover:bg-black/80 hover:text-red-400 disabled:opacity-50"
              title="Remove image"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload zone ── */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
            isDragActive
              ? "border-cyan-500/50 bg-cyan-500/5"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
          } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={onFileChange}
            className="hidden"
          />

          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-white/60">Uploading…</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-10 w-10 text-cyan-400" />
              <p className="mt-3 text-sm text-white/70">Drop image here</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-white/30" />
              <p className="mt-3 text-sm text-white/60">
                Drag & drop or click to upload
              </p>
              <p className="mt-1 text-xs text-white/30">
                {hint || `${mimeSummary} · Max ${sizeMb}MB`}
              </p>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
