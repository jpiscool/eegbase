export default function ReportLoading() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }} className="animate-pulse">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-10 space-y-8">
        <div className="flex justify-between pb-5 border-b border-gray-200">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-40 bg-gray-100 rounded" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-28 bg-gray-200 rounded ml-auto" />
            <div className="h-3 w-20 bg-gray-100 rounded ml-auto" />
            <div className="h-3 w-32 bg-gray-100 rounded ml-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-7 w-10 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
