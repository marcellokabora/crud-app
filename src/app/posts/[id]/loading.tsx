export default function PostLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="max-w-3xl mx-auto border rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-9 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-4 pt-6 border-t">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
