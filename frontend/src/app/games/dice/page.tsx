"use client";

import { useState } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useBalance } from "@/context/BalanceContext";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function DiceGame() {
  const { balance, debit, credit } = useBalance();
  const [rollUnder, setRollUnder] = useState(50);
  const [betAmount, setBetAmount] = useState<string>("100");
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<"win" | "loss" | null>(null);

  // The Math: 98 represents a 98% Return to Player (2% House Edge)
  const winChance = rollUnder - 1;
  const multiplier = (98 / winChance).toFixed(2);
  const potentialWin = (Number(betAmount) * (98 / winChance)).toFixed(2);

  const handleHalf = () =>
    setBetAmount((prev) => String(Math.max(1, Math.floor(Number(prev) / 2))));
  const handleDouble = () =>
    setBetAmount((prev) => String(Math.min(balance, Number(prev) * 2)));

  const handleRoll = () => {
    const bet = Number(betAmount);
    if (bet <= 0 || bet > balance || isRolling) return;

    const success = debit(bet);
    if (!success) return;

    setIsRolling(true);
    setLastRoll(null);
    setLastResult(null);

    setTimeout(() => {
      const result = Math.floor(Math.random() * 100) + 1;
      const won = result < rollUnder;
      setLastRoll(result);
      setLastResult(won ? "win" : "loss");
      setIsRolling(false);
      if (won) {
        const payout = (bet * 98) / winChance;
        credit(payout);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="mb-6 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-3xl font-bold text-zinc-100 uppercase tracking-widest ${space.className}`}>Crypto Dice</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Game Stage (Right side on desktop, top on mobile) */}
        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-xl relative overflow-hidden min-h-[300px] lg:min-h-[500px] flex flex-col items-center justify-center shadow-inner order-1 lg:order-2">
          
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #fbbf24 0%, transparent 50%)' }}></div>
          
          <div className="relative z-10 text-center">
            <div className={`text-[120px] leading-none font-bold transition-all duration-300 drop-shadow-2xl ${
              isRolling
                ? "text-zinc-700 animate-pulse scale-95"
                : lastResult === "win"
                ? "text-emerald-500 scale-110 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                : lastResult === "loss"
                ? "text-red-500 scale-100 drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                : "text-zinc-300"
            } ${space.className}`}>
              {isRolling ? "..." : lastRoll !== null ? lastRoll : "00"}
            </div>

            {/* Result banner */}
            <div className={`mt-8 h-12 flex items-center justify-center text-xl font-bold tracking-widest uppercase transition-all duration-300 ${fira.className} ${
                lastResult === "win" ? "text-emerald-400 opacity-100 translate-y-0" : 
                lastResult === "loss" ? "text-red-400 opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}>
              {lastResult === "win" && `+ $${potentialWin}`}
              {lastResult === "loss" && `− $${Number(betAmount).toFixed(2)}`}
            </div>
            
            <div className={`mt-12 w-full max-w-md mx-auto px-8 ${fira.className}`}>
              <div className="flex justify-between text-xs text-zinc-500 mb-2 font-bold uppercase tracking-widest">
                <span>0</span>
                <span className="text-[#fbbf24]">Target: {rollUnder}</span>
                <span>100</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-emerald-500/80 transition-all duration-300"
                  style={{ width: `${rollUnder}%` }}
                ></div>
                <div 
                  className="absolute top-0 right-0 h-full bg-red-500/80 transition-all duration-300"
                  style={{ width: `${100 - rollUnder}%` }}
                ></div>
                {lastRoll !== null && !isRolling && (
                  <div 
                    className="absolute top-0 h-full w-2 bg-white shadow-[0_0_10px_white] z-10 transition-all duration-500"
                    style={{ left: `calc(${lastRoll}% - 4px)` }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel (Left side on desktop, bottom on mobile) */}
        <div className="w-full lg:w-80 bg-[#18181b] border border-zinc-800 rounded-xl p-6 shrink-0 flex flex-col order-2 lg:order-1 shadow-2xl z-10">
          
          {/* Bet Amount */}
          <div className="mb-6">
            <label className={`block text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2 ${fira.className}`}>
              Bet Amount
            </label>
            <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors p-1">
              <span className="pl-3 text-zinc-500 font-bold">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isRolling}
                className={`w-full bg-transparent text-zinc-200 p-2 outline-none font-bold disabled:opacity-50 ${fira.className}`}
              />
              <div className="flex gap-1 pr-1">
                <button
                  onClick={handleHalf}
                  disabled={isRolling}
                  className="px-2 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  ½
                </button>
                <button
                  onClick={handleDouble}
                  disabled={isRolling}
                  className="px-2 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          {/* Sliders / Inputs */}
          <div className="mb-6 bg-[#09090b] border border-zinc-800 rounded p-4">
             <label className={`block text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4 flex justify-between ${fira.className}`}>
              <span>Roll Under</span>
              <span className="text-[#fbbf24] text-lg">{rollUnder}</span>
            </label>
            <input
              type="range"
              min="2"
              max="98"
              value={rollUnder}
              onChange={(e) => setRollUnder(Number(e.target.value))}
              disabled={isRolling}
              className="w-full accent-[#fbbf24] h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-2 gap-2 mb-8 ${fira.className}`}>
            <div className="bg-[#09090b] border border-zinc-800 rounded p-3 text-center">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Multiplier</div>
              <div className="font-bold text-zinc-200">{multiplier}×</div>
            </div>
            <div className="bg-[#09090b] border border-zinc-800 rounded p-3 text-center">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Win Chance</div>
              <div className="font-bold text-zinc-200">{winChance}%</div>
            </div>
            <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-center flex justify-between items-center px-4 mt-2">
              <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Potential Profit</div>
              <div className="font-bold text-emerald-400 text-lg">${potentialWin}</div>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={handleRoll}
              disabled={isRolling || Number(betAmount) <= 0 || Number(betAmount) > balance}
              className={`w-full py-4 text-[#09090b] font-bold text-lg uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${space.className}`}
            >
              {isRolling ? "Rolling..." : "Bet"}
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}