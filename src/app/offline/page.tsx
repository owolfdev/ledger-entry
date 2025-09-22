export const runtime = "edge";

export default function OfflinePage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-muted-foreground">
          This app works offline for previously visited pages and cached data.
          Some features that require network access (like GitHub sync and
          authentication) are unavailable until you reconnect.
        </p>
      </div>
    </div>
  );
}
