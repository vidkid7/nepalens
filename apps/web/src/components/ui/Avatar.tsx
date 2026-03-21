interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-micro",
  sm: "w-8 h-8 text-micro",
  md: "w-10 h-10 text-caption",
  lg: "w-14 h-14 text-subtitle",
  xl: "w-20 h-20 text-title",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hashColor(name: string): string {
  const colors = [
    "bg-brand", "bg-blue-500", "bg-purple-500", "bg-pink-500",
    "bg-orange-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ src, alt, name, size = "md", className = "" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || "Avatar"}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${hashColor(name || "?")} rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${className}`}
      aria-label={alt || name || "Avatar"}
    >
      {getInitials(name)}
    </div>
  );
}
