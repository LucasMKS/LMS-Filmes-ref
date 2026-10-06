import React from 'react';

interface MediaGridSkeletonProps {
  count?: number;
}

export const MediaGridSkeleton: React.FC<MediaGridSkeletonProps> = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 animate-pulse"
        >
          <div className="aspect-[2/3] w-full bg-zinc-800/60" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-4/5" />
            <div className="h-3 bg-zinc-800/60 rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
};
