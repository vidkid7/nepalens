"use client";

import { useState, useRef, useEffect } from "react";

interface BlurHashImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string | null;
  bgColor?: string | null;
  className?: string;
  priority?: boolean;
}

export default function BlurHashImage({
  src,
  alt,
  width,
  height,
  blurHash,
  bgColor,
  className = "",
  priority = false,
}: BlurHashImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to defer loading until near viewport
  useEffect(() => {
    if (priority || inView) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // Start loading 400px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${width}/${height}`,
        backgroundColor: bgColor || "#e5e7eb",
      }}
    >
      {/* Shimmer placeholder while loading */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: bgColor || "#e5e7eb" }}
      >
        <div className="absolute inset-0 skeleton" />
      </div>

      {/* Actual image — only start loading when near viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ willChange: "opacity" }}
        />
      )}
    </div>
  );
}
