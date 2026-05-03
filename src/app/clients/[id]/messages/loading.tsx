export default function MessagesLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-pulse">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div>
          <div className="h-5 w-36 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-200 mt-4 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`h-10 rounded-xl ${i % 2 === 0 ? "bg-gray-100 w-48" : "bg-blue-100 w-40"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
