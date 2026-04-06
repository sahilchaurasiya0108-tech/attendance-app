export default function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-glow">
            <img src="/icon-192.png" alt="To Fly Media" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-500/50 animate-ping" />
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide">Loading…</p>
      </div>
    </div>
  );
}