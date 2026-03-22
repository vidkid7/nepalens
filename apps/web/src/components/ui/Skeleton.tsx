"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

const SKELETON_HEIGHTS = [
  [250, 320, 200, 280],
  [350, 220, 280, 320],
  [200, 350, 250, 220],
];

export function PhotoCardSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton variant="card" height={height} className="w-full" />
    </div>
  );
}

export function MasonryGridSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="flex gap-4 px-4 sm:px-6">
      {Array.from({ length: columns }, (_, col) => (
        <div key={col} className="flex-1 flex flex-col gap-4">
          {(SKELETON_HEIGHTS[col % SKELETON_HEIGHTS.length]).map((h, i) => (
            <PhotoCardSkeleton key={i} height={h} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className="w-3/4" />
        </td>
      ))}
    </tr>
  );
}
