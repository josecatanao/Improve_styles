import Image from 'next/image'

export function Logo({ className = "h-11 w-11 rounded-2xl" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      <Image 
        src="/logo.png" 
        alt="Improve Styles Logo" 
        fill 
        className="object-contain"
        priority
      />
    </div>
  )
}
