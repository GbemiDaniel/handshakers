import PayoutCalculator from "@/components/PayoutCalculator";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full space-y-8">
        {/* App Title & Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prorated Time Share Calculator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Payout Calculator
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Convert logged time durations and prorate platform payout share instantly.
          </p>
        </header>

        {/* Core Calculator Component */}
        <PayoutCalculator />

        {/* Footer Info */}
        <footer className="text-center text-xs text-slate-400 pt-4">
          <p>Format durations as <code className="text-slate-600 font-mono">HH:MM</code> (e.g. 16:20 = 16h 20m)</p>
        </footer>
      </div>
    </main>
  );
}
