export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
        <div>
          <div className="h-7 w-28 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-4 w-56 bg-gray-200 rounded mb-5" />
          <div className="h-36 bg-gray-50 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-4 w-40 bg-gray-200 rounded mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-7 bg-gray-100 rounded" />
                <div className="flex-1 h-4 bg-gray-100 rounded-full" />
                <div className="h-3 w-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-64 bg-gray-100 rounded mb-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3">
              <div className="h-4 flex-1 bg-gray-100 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
              <div className="h-4 w-10 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
