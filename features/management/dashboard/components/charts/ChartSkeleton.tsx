"use client";

import React from "react";

export function ChartSkeleton({ height = "h-72" }: { height?: string }) {
  return (
    <div className={`w-full ${height} flex flex-col justify-center items-center gap-3 bg-muted/20 animate-pulse rounded-lg p-4`}>
      <div className="w-full flex items-end justify-between h-40 gap-2 px-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-full flex gap-1 items-end h-full">
            <div
              className="w-1/2 bg-muted/60 rounded-t"
              style={{ height: `${20 + ((i * 13) % 70)}%` }}
            />
            <div
              className="w-1/2 bg-muted/40 rounded-t"
              style={{ height: `${30 + ((i * 17) % 60)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="w-48 h-3 bg-muted/60 rounded" />
    </div>
  );
}
