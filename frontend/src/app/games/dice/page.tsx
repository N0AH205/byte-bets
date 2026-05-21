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
    <div className="min-h-screen p-8 md:p-12 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-2xl mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>Crypto Dice</h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>Set your target and execute the roll.</p>
        </div>
        <div className={`text-right ${fira.className}`}>
          <div className="text-xs text-zinc-500 uppercase">Wallet Balance</div>
          <div className="text-emerald-500 text-lg font-bold tracking-widest">
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Game Console */}
      <div className="w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-lg p-8 shadow-2xl relative">

        {/* Decorative corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#fbbf24] rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#fbbf24] rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#fbbf24] rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#fbbf24] rounded-br-lg"></div>

        {/* Result Display */}
        <div className="bg-[#09090b] border border-zinc-800 rounded p-6 mb-8 text-center relative overflow-hidden">
          <div className={`text-sm text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>
            Result Output
          </div>
          <div className={`text-7xl font-bold transition-colors duration-300 ${
            isRolling
              ? "text-zinc-700 animate-pulse"
              : lastResult === "win"
              ? "text-emerald-500"
              : lastResult === "loss"
              ? "text-red-500"
              : "text-zinc-300"
          } ${space.className}`}>
            {isRolling ? "..." : lastRoll !== null ? lastRoll : "00"}
          </div>

          {/* Result banner */}
          {!isRolling && lastResult && (
            <div className={`mt-3 text-sm font-bold tracking-widest uppercase ${fira.className} ${
              lastResult === "win" ? "text-emerald-400" : "text-red-400"
            }`}>
              {lastResult === "win"
                ? `✓ WIN  +$${potentialWin}`
                : `✗ LOSS  −$${Number(betAmount).toFixed(2)}`}
            </div>
          )}

          {/* Mock Hash output */}
          <div className={`mt-4 text-[10px] text-zinc-600 break-all ${fira.className}`}>
            HASH: {isRolling ? "generating sequence..." : "0x7a8b9c...f1e2d3c4b5a697887"}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* Left Column: Bet Amount */}
          <div>
            <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>
              Bet Amount
            </label>
            <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors">
              <span className="pl-3 text-zinc-500">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isRolling}
                className={`w-full bg-transparent text-zinc-200 p-3 outline-none disabled:opacity-50 ${fira.className}`}
              />
              <button
                onClick={handleHalf}
                disabled={isRolling}
                className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] disabled:opacity-40 transition-colors"
              >
                ½
              </button>
              <button
                onClick={handleDouble}
                disabled={isRolling}
                className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] border-l border-zinc-800 disabled:opacity-40 transition-colors"
              >
                2×
              </button>
            </div>
          </div>

          {/* Right Column: Stats */}
          <div className={`bg-[#09090b] border border-zinc-800 rounded p-4 flex flex-col justify-center gap-1.5 ${fira.className}`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Multiplier</span>
              <span className="text-[#fbbf24]">{multiplier}×</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Win Chance</span>
              <span className="text-[#fbbf24]">{winChance}%</span>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-800/50 pt-1.5 mt-0.5">
              <span className="text-zinc-500">Potential Win</span>
              <span className="text-emerald-400">${potentialWin}</span>
            </div>
          </div>
        </div>

        {/* Slider Section */}
        <div className="mb-8">
          <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-4 flex justify-between ${fira.className}`}>
            <span>Roll Under Target</span>
            <span className="text-[#fbbf24] text-lg">{rollUnder}</span>
          </label>
          <input
            type="range"
            min="2"
            max="98"
            value={rollUnder}
            onChange={(e) => setRollUnder(Number(e.target.value))}
            className="w-full accent-[#fbbf24] h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className={`flex justify-between mt-2 text-xs text-zinc-600 ${fira.className}`}>
            <span>Risky (High Payout)</span>
            <span>Safe (High Chance)</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRoll}
          disabled={isRolling || Number(betAmount) <= 0 || Number(betAmount) > balance}
          className={`w-full py-4 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${space.className}`}
        >
          {isRolling ? "EXECUTING HASH..." : "ROLL DICE"}
        </button>

      </div>
    </div>
  );
}