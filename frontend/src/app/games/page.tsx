import { Space_Grotesk, Fira_Code } from "next/font/google";
import Link from "next/link";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

const GAMES = [
  { id: "dice", name: "Crypto Dice", desc: "Set your target and roll the dice.", type: "Dice", active: true },
  { id: "plinko", name: "Plinko", desc: "Drop the ball and watch the multipliers.", type: "Physics", active: true },
  { id: "crash", name: "Crash", desc: "Cash out before the multiplier crashes.", type: "Multiplier", active: true },
  { id: "mines", name: "Mines", desc: "Clear the board but avoid the mines.", type: "Grid", active: true },
  { id: "hilo", name: "Hi-Lo", desc: "Guess if the next card is higher or lower.", type: "Cards", active: true },
];

export default function GamesMenu() {
  return (
    <main className="min-h-screen bg-[#09090b] relative overflow-hidden p-6 md:p-12">
      
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      ></div>

      <header className="relative z-10 flex justify-between items-center mb-16 border-b border-zinc-800 pb-6">
        <div className={`flex items-center gap-3 ${space.className}`}>
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center font-bold text-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.1)]">
            B
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-zinc-200 uppercase">Games</h1>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {GAMES.map((game) => (
          <Link href={`/games/${game.id}`} key={game.id} className="group block">
            <div className="relative h-full bg-[#18181b] border border-zinc-800 rounded-lg p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#fbbf24]/50 hover:shadow-[0_10px_30px_-10px_rgba(251,191,36,0.15)]">
              
              <div className={`flex justify-end items-start mb-8 ${fira.className}`}>
                <div className="flex items-center gap-2 text-xs text-emerald-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  ONLINE
                </div>
              </div>

              <div className="space-y-3">
                <h2 className={`text-3xl font-bold tracking-tighter text-zinc-100 group-hover:text-[#fbbf24] transition-colors uppercase ${space.className}`}>
                  {game.name}
                </h2>
                <p className={`text-sm text-zinc-500 leading-relaxed ${fira.className}`}>
                  {game.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800/50 flex gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-1 w-full bg-[#fbbf24] rounded-sm"></div>
                ))}
              </div>

            </div>
          </Link>
        ))}
        
        <div className="relative h-full bg-[#09090b] border border-dashed border-zinc-800 rounded-lg p-6 flex items-center justify-center opacity-50">
           <span className={`text-sm tracking-widest text-zinc-600 uppercase ${fira.className}`}>Coming Soon</span>
        </div>
      </div>

    </main>
  );
}