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
            <div className="relative h-[240px] bg-[#18181b] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#fbbf24]/50 hover:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.3)]">
              
              {/* Glossy overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className={`flex justify-between items-start mb-4 relative z-10 ${fira.className}`}>
                <div className="px-2 py-1 bg-zinc-800/80 rounded text-[10px] text-zinc-400 font-bold uppercase tracking-widest border border-zinc-700/50">
                  {game.type}
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  ONLINE
                </div>
              </div>

              <div className="relative z-10 space-y-2 mt-auto">
                <h2 className={`text-3xl font-bold tracking-tighter text-zinc-100 group-hover:text-[#fbbf24] transition-colors uppercase ${space.className}`}>
                  {game.name}
                </h2>
                <p className={`text-sm text-zinc-500 leading-relaxed ${fira.className}`}>
                  {game.desc}
                </p>
              </div>

              {/* Decorative progress bar at bottom */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800">
                <div className="h-full bg-gradient-to-r from-[#fbbf24] to-[#b45309] w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
              </div>

            </div>
          </Link>
        ))}
        
        <div className="relative h-[240px] bg-[#09090b] border border-dashed border-zinc-800 rounded-xl p-6 flex items-center justify-center opacity-50">
           <span className={`text-sm tracking-widest text-zinc-600 uppercase ${fira.className}`}>More Games Soon</span>
        </div>
      </div>

    </main>
  );
}