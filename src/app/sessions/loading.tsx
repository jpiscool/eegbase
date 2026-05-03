export default function SessionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 flex gap-6 px-5 py-3">
          {["Client", "Protocol", "Date", "Duration", "Avg Reward", "Focus Δ"].map((col) => (
            <div key={col} className="h-4 w-16 bg-gray-200 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-5 py-3.5 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
