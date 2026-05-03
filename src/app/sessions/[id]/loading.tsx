export default function SessionDetailLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
            <div className="h-5 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Pre/Post */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="h-4 w-40 bg-gray-200 rounded mb-5" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
