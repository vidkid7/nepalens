"use client";

import { useState } from "react";

interface BlurHashImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string | null;
  bgColor?: string | null;
  className?: string;
}

export default function BlurHashImage({
  src,
  alt,
  width,
  height,
  blurHash,
  bgColor,
  className = "",
}: BlurHashImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${width}/${height}`,
        backgroundColor: bgColor || "#e5e7eb",
      }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: bgColor || "#e5e7eb" }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
