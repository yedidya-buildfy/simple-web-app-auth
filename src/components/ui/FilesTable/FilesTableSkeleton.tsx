"use client";

interface FilesTableSkeletonProps {
  rows?: number;
}

export function FilesTableSkeleton({ rows = 5 }: FilesTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="border-b border-border">
          {/* Checkbox */}
          <td className="px-4 py-3 w-12">
            <div className="w-4 h-4 bg-background-hover rounded animate-pulse" />
          </td>
          {/* Filename */}
          <td className="px-4 py-3">
            <div className="h-4 bg-background-hover rounded w-48 animate-pulse" />
          </td>
          {/* Size */}
          <td className="px-4 py-3 w-20">
            <div className="h-4 bg-background-hover rounded w-14 animate-pulse" />
          </td>
          {/* Status */}
          <td className="px-4 py-3 w-28">
            <div className="h-6 bg-background-hover rounded-full w-20 animate-pulse" />
          </td>
          {/* Extracted */}
          <td className="px-4 py-3 w-32">
            <div className="h-4 bg-background-hover rounded w-24 animate-pulse" />
          </td>
          {/* Matched */}
          <td className="px-4 py-3 w-28">
            <div className="h-4 bg-background-hover rounded w-20 animate-pulse" />
          </td>
          {/* Uploaded */}
          <td className="px-4 py-3 w-28">
            <div className="h-4 bg-background-hover rounded w-16 animate-pulse" />
          </td>
          {/* Actions */}
          <td className="px-4 py-3 w-14">
            <div className="w-6 h-6 bg-background-hover rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}
