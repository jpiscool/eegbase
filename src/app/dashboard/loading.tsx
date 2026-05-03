export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-56 bg-gray-100 rounded mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-100 rounded-lg" />
            <div>
              <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-7 w-12 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="h-4 w-52 bg-gray-200 rounded mb-4" />
        <div className="h-[120px] bg-gray-50 rounded-lg" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 w-36 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-6 py-3.5 border-b border-gray-50">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
