import { Skeleton } from "@/components/ui/skeleton";

export function TrendingSkeleton() {
  return (
    <div className="w-full flex space-x-2 md:space-x-4 overflow-hidden px-1 md:px-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 shrink-0 p-1">
          <Skeleton className="w-full aspect-[2/3] rounded-xl" />
        </div>
      ))}
    </div>
  );
}
