export default function ProtocolDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-7 w-48 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-blue-100 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-28 bg-gray-50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-5 w-36 bg-gray-200 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-gray-50">
              <div className="h-4 w-28 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-14 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3 border-b border-gray-50">
              <div className="h-4 w-32 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
