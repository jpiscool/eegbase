export default function ProtocolsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-36 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded-full" />
                <div className="h-4 w-12 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-72 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
