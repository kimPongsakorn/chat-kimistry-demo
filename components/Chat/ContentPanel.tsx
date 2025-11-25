"use client";

interface ContentPanelProps {
  isBlurred?: boolean;
}

export function ContentPanel({ isBlurred = false }: ContentPanelProps) {
  return (
    <div
      className={`flex h-full items-center justify-center p-6 ${
        isBlurred ? "blur-sm pointer-events-none" : ""
      }`}
    >
      <span className="font-semibold">Content</span>
    </div>
  );
}

