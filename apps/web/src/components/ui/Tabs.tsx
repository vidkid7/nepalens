"use client";

import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pill";
  size?: "sm" | "md";
  className?: string;
}

export default function Tabs({
  tabs,
  active,
  onChange,
  variant = "underline",
  size = "md",
  className = "",
}: TabsProps) {
  if (variant === "pill") {
    return (
      <div className={`flex gap-1 ${className}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full transition-colors select-none
              ${size === "sm" ? "px-3 py-1.5 text-micro" : "px-4 py-2 text-caption font-medium"}
              ${active === tab.id
                ? "bg-surface-900 text-white"
                : "text-surface-600 hover:bg-surface-100"}`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`${active === tab.id ? "text-white/70" : "text-surface-400"}`}>
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-0 border-b border-surface-200 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-1.5 border-b-2 transition-colors select-none
            ${size === "sm" ? "px-3 py-2 text-caption" : "px-4 py-3 text-caption font-medium"}
            ${active === tab.id
              ? "border-surface-900 text-surface-900"
              : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"}`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-micro ${active === tab.id ? "text-surface-500" : "text-surface-400"}`}>
              {tab.count.toLocaleString()}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
