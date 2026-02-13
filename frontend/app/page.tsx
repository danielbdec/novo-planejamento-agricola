import { Timeline } from "@/components/timeline/Timeline";
import { PlanningProvider } from "@/context/PlanningContext";

export default function Home() {
  return (
    <PlanningProvider>
      <main className="flex h-screen w-full flex-col bg-background overflow-hidden relative">
        {/* Background Effects */}
        {/* Background Effects */}
        <div className="absolute inset-0 bg-slate-950 bg-noise pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-agri-green-950/40 via-slate-950/80 to-slate-950 pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col p-6 h-full">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1">
                Planejamento <span className="text-primary">2026</span>
              </h1>
              <p className="text-muted-foreground text-sm">Fazenda Santa Fé • Soja Safra 25/26</p>
            </div>

            <div className="flex gap-4">
              {/* Placeholder for future actions */}
              <div className="h-10 w-10 rounded-full bg-secondary/50 border border-white/10" />
            </div>
          </header>

          <div className="flex-1 w-full min-h-0 bg-card/10 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <Timeline />
          </div>
        </div>
      </main>
    </PlanningProvider>
  );
}
