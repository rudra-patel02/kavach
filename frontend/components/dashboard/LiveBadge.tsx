"use client";

export default function LiveBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-red-500/20 border border-red-500 px-3 py-1 w-fit">
      <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>

      <span className="text-red-400 font-semibold text-sm">
        LIVE
      </span>
    </div>
  );
}