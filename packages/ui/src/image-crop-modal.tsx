"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X } from "lucide-react";

interface ImageCropModalProps {
  imageSrc: string;
  aspect?: number;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
}

export function ImageCropModal({
  imageSrc,
  aspect = 1,
  onCropComplete,
  onClose,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        const croppedFile = new File([croppedImage], "cropped-image.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyan-400">
            Crop Profile Image
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative mt-4 h-80 w-full overflow-hidden rounded-md bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* Zoom Controls */}
        <div className="mt-4 space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Zoom
          </label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-cyan-400"
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="rounded-md bg-cyan-500 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-[0.98] active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            Crop &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cropping Helpers ────────────────────────────────────────────────────────

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg");
  });
}
