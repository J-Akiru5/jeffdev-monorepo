"use client";

import { useState } from "react";
import Image from "next/image";

export interface GalleryImage {
  url: string;
  alt?: string;
}

interface ProjectGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const activeImage = images[activeIndex] || images[0];

  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-8">
          Project Gallery
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px]">
          {/* Main View Area */}
          <div className="flex-1 relative overflow-hidden h-[400px] lg:h-full flex items-center justify-center">
            {activeImage && (
              <Image
                src={activeImage.url}
                alt={activeImage.alt || `${title} screenshot ${activeIndex + 1}`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 1024px) 100vw, 75vw"
                priority
              />
            )}
          </div>

          {/* Thumbnails Sidebar */}
          <div className="w-full lg:w-48 xl:w-64 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-32 h-24 lg:w-full lg:h-32 rounded-md overflow-hidden border-2 transition-all bg-[var(--bg-secondary)] flex items-center justify-center ${
                  activeIndex === idx
                    ? "border-cyan-500 ring-2 ring-cyan-500/20"
                    : "border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] opacity-60 hover:opacity-100"
                }`}
                aria-label={`View screenshot ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${title} thumbnail ${idx + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 1024px) 128px, 256px"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
