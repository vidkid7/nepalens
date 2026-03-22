import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-app py-12">
      <div className="space-y-6">
        <Skeleton variant="text" className="w-1/3 h-8" />
        <Skeleton variant="text" className="w-2/3 h-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="w-full h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
