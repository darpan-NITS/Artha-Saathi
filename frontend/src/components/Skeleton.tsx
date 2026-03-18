export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 rounded w-full" />
        <div className="h-8 bg-gray-100 rounded w-5/6" />
        <div className="h-8 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
      <div className="h-52 bg-gray-50 rounded-xl flex items-end gap-2 px-4 pb-4">
        {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}
