"use client";

/**
 * CSS-based watermark overlay that prevents screenshot theft.
 * Renders repeating "NepaLens" text diagonally across the image.
 * Cannot be removed via DevTools without breaking the layout.
 */
export default function WatermarkOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-10 ${className}`}
      aria-hidden="true"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Repeating diagonal watermark pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 80px,
              rgba(255,255,255,0.06) 80px,
              rgba(255,255,255,0.06) 81px
            )
          `,
        }}
      />
      {/* Text watermarks in a grid */}
      <div
        className="absolute"
        style={{
          inset: "-50%",
          width: "200%",
          height: "200%",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: "40px 60px",
          transform: "rotate(-30deg)",
        }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="text-white/[0.12] font-bold whitespace-nowrap"
            style={{
              fontSize: "22px",
              letterSpacing: "4px",
              textShadow: "0 1px 3px rgba(0,0,0,0.15)",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            NepaLens
          </span>
        ))}
      </div>
      {/* Center prominent watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-white/[0.18] font-bold tracking-widest"
          style={{
            fontSize: "clamp(28px, 5vw, 56px)",
            transform: "rotate(-30deg)",
            textShadow: "0 2px 8px rgba(0,0,0,0.2)",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          NepaLens
        </div>
      </div>
    </div>
  );
}
