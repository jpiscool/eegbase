export default function ClientDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
        <div className="flex-1">
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-[180px] bg-gray-50 rounded-lg" />
      </div>

      {/* Session table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 w-36 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-5 px-6 py-3.5 border-b border-gray-50">
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
