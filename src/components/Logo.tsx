import { SparklesIcon } from '@heroicons/react/24/outline'

export default function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-supabase-green/20 p-3 rounded-xl border border-supabase-green/30">
        <SparklesIcon className={`text-[#5ED591] ${className} stroke-[1.5]`} />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">
        Invoice<span className="text-[#5ED591]">Match</span>
      </h1>
    </div>
  )
}
