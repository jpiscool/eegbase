export default function CheckInsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-100 rounded-lg" />
            </div>
          ))}
          <div className="h-10 bg-gray-200 rounded-lg mt-2" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
