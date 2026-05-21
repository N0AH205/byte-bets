"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useBalance } from "@/context/BalanceContext";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

type GameState = "idle" | "running" | "crashed" | "cashed";

const TICK_MS = 50; // update interval in ms

function generateCrashPoint(): number {
  // House edge ~3%. E[crash] ≈ 1 / (1 - 0.03) ≈ 1.03
  // Use a geometric-like distribution: crash = 0.97 / random
  const r = Math.random();
  if (r < 0.01) return 1.0; // instant crash 1% of the time
  return Math.max(1.0, 0.97 / r);
}

export default function CrashGame() {
  const { balance, debit, credit } = useBalance();
  const [betAmount, setBetAmount] = useState<string>("100");
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [, setCrashPoint] = useState<number>(1.0);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [betQueued, setBetQueued] = useState<boolean>(false); // pre-queue for next round
  const [history, setHistory] = useState<number[]>([4.21, 1.0, 11.3, 1.52, 2.0, 7.8]);
  const [chartPoints, setChartPoints] = useState<{ x: number; y: number }[]>([]);
  const [elapsed, setElapsed] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(1.0);
  const hasBetRef = useRef<boolean>(false);
  const betRef = useRef<string>("100");
  const autoCashoutRef = useRef<string>("2.00");

  const betQueuedRef = useRef<boolean>(false);

  useEffect(() => { hasBetRef.current = hasBet; }, [hasBet]);
  useEffect(() => { betRef.current = betAmount; }, [betAmount]);
  useEffect(() => { autoCashoutRef.current = autoCashout; }, [autoCashout]);
  useEffect(() => { betQueuedRef.current = betQueued; }, [betQueued]);

  const stopGame = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startRound = useCallback(() => {
    const cp = generateCrashPoint();
    crashPointRef.current = cp;
    setCrashPoint(cp);
    setMultiplier(1.0);
    setChartPoints([{ x: 0, y: 1.0 }]);
    setElapsed(0);
    setGameState("running");
    startTimeRef.current = Date.now();

    // Auto-place queued bet when the round starts
    if (betQueuedRef.current) {
      const bet = Number(betRef.current);
      debit(bet);
      setHasBet(true);
      hasBetRef.current = true;
      setBetQueued(false);
      betQueuedRef.current = false;
    }

    intervalRef.current = setInterval(() => {
      const t = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: m = e^(0.075 * t)
      const m = Math.pow(Math.E, 0.075 * t);
      const rounded = Math.floor(m * 100) / 100;

      setMultiplier(rounded);
      setElapsed(t);
      setChartPoints(prev => [...prev, { x: t, y: rounded }]);

      // Auto cashout
      const ac = parseFloat(autoCashoutRef.current);
      if (!isNaN(ac) && hasBetRef.current && rounded >= ac) {
        const winnings = Number(betRef.current) * rounded;
        credit(winnings);
        setHasBet(false);
        hasBetRef.current = false;
        setGameState("cashed");
        setHistory(prev => [rounded, ...prev].slice(0, 10));
        stopGame();
        setTimeout(startRound, 3000);
        return;
      }

      // Crash check
      if (rounded >= crashPointRef.current) {
        setMultiplier(crashPointRef.current);
        setGameState("crashed");
        setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10));
        stopGame();
        setTimeout(startRound, 3000);
      }
    }, TICK_MS);
  }, [stopGame, debit, credit]);

  useEffect(() => {
    const timer = setTimeout(() => startRound(), 2000);
    return () => {
      clearTimeout(timer);
      stopGame();
    };
  }, [startRound, stopGame]);

  const handlePlaceBet = () => {
    const bet = Number(betAmount);
    if (bet <= 0 || bet > balance || hasBet) return;
    if (gameState === "running") {
      // Place bet immediately in a live round
      debit(bet);
      setHasBet(true);
      hasBetRef.current = true;
    } else {
      // Queue the bet for the next round
      setBetQueued(true);
      betQueuedRef.current = true;
    }
  };

  const handleCancelQueue = () => {
    setBetQueued(false);
    betQueuedRef.current = false;
  };

  const handleCashout = () => {
    if (!hasBet || gameState !== "running") return;
    const winnings = Number(betAmount) * multiplier;
    credit(winnings);
    setHasBet(false);
    hasBetRef.current = false;
    setGameState("cashed");
    setHistory(prev => [multiplier, ...prev].slice(0, 10));
    stopGame();
    setTimeout(startRound, 3000);
  };

  // Build SVG path from chartPoints
  const W = 600;
  const H = 260;
  const PAD = 40;
  const maxX = Math.max(elapsed, 5);
  const maxY = Math.max(multiplier * 1.2, 3);

  const toSvg = (x: number, y: number) => ({
    sx: PAD + (x / maxX) * (W - PAD * 2),
    sy: H - PAD - ((y - 1) / (maxY - 1)) * (H - PAD * 2),
  });

  const pathD = chartPoints.length > 1
    ? chartPoints.map((p, i) => {
        const { sx, sy } = toSvg(p.x, p.y);
        return i === 0 ? `M ${sx} ${sy}` : `L ${sx} ${sy}`;
      }).join(" ")
    : "";

  const fillD = chartPoints.length > 1
    ? pathD + ` L ${toSvg(chartPoints[chartPoints.length - 1].x, 1.0).sx} ${H - PAD} L ${PAD} ${H - PAD} Z`
    : "";

  const getMultiplierColor = () => {
    if (gameState === "crashed") return "text-red-500";
    if (gameState === "cashed") return "text-emerald-400";
    if (multiplier >= 5) return "text-emerald-400";
    if (multiplier >= 2) return "text-[#fbbf24]";
    return "text-zinc-100";
  };

  const getStatusLabel = () => {
    if (gameState === "idle") return { text: "WAITING FOR ROUND...", color: "text-zinc-500" };
    if (gameState === "crashed") return { text: "CRASHED!", color: "text-red-500" };
    if (gameState === "cashed") return { text: "CASHED OUT!", color: "text-emerald-400" };
    return { text: "LIVE", color: "text-emerald-400" };
  };

  const status = getStatusLabel();

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-5xl mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>
            BYTE BETS <span className="text-[#fbbf24]">Crash</span>
          </h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>
            Cash out before the multiplier crashes.
          </p>
        </div>
        <div className={`text-right ${fira.className}`}>
          <div className="text-xs text-zinc-500 uppercase">Wallet Balance</div>
          <div className="text-emerald-500 text-lg font-bold tracking-widest">
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Queued bet banner */}
      {betQueued && (
        <div className={`w-full max-w-5xl mb-4 flex items-center justify-between bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded px-4 py-2 ${fira.className}`}>
          <span className="text-xs text-[#fbbf24] uppercase tracking-widest">
            ⏳ Bet queued for next round — ${Number(betAmount).toFixed(2)}
          </span>
          <button onClick={handleCancelQueue} className="text-xs text-zinc-500 hover:text-red-400 uppercase tracking-widest transition-colors">
            Cancel
          </button>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col xl:flex-row gap-6">

        {/* Left: Controls */}
        <div className="w-full xl:w-72 bg-[#18181b] border border-zinc-800 rounded-lg p-6 flex flex-col gap-6 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#fbbf24] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#fbbf24] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#fbbf24] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#fbbf24] rounded-br-lg" />

          <div>
            <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Bet Amount</label>
            <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors">
              <span className="pl-3 text-zinc-500">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={hasBet}
                className={`w-full bg-transparent text-zinc-200 p-3 outline-none disabled:opacity-50 ${fira.className}`}
              />
              <button onClick={() => setBetAmount(String(Number(betAmount) / 2))} className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24]">½</button>
              <button onClick={() => setBetAmount(String(Number(betAmount) * 2))} className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] border-l border-zinc-800">2×</button>
            </div>
          </div>

          <div>
            <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Auto Cashout At</label>
            <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors">
              <input
                type="number"
                step="0.1"
                value={autoCashout}
                onChange={e => setAutoCashout(e.target.value)}
                className={`w-full bg-transparent text-zinc-200 p-3 outline-none ${fira.className}`}
              />
              <span className="pr-3 text-zinc-500">×</span>
            </div>
          </div>

          {/* Potential win */}
          {hasBet && (
            <div className={`bg-[#09090b] border border-zinc-800 rounded p-3 ${fira.className}`}>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Potential Win</span>
                <span className="text-emerald-400">${(Number(betAmount) * multiplier).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">Profit</span>
                <span className="text-[#fbbf24]">+${(Number(betAmount) * multiplier - Number(betAmount)).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action button */}
          {gameState === "running" && hasBet ? (
            <button
              onClick={handleCashout}
              className={`w-full py-4 text-white font-bold uppercase tracking-widest rounded bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border-b-4 border-emerald-900 hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all ${space.className}`}
            >
              CASH OUT ${(Number(betAmount) * multiplier).toFixed(2)}
            </button>
          ) : (
            <button
              onClick={handlePlaceBet}
              disabled={hasBet || betQueued || Number(betAmount) <= 0 || Number(betAmount) > balance}
              className={`w-full py-4 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${space.className}`}
            >
              {betQueued ? "BET QUEUED ✓" : hasBet ? "BET PLACED" : gameState === "running" ? "PLACE BET" : "BET NEXT ROUND"}
            </button>
          )}

          {/* History */}
          <div>
            <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-3 ${fira.className}`}>Recent Crashes</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${fira.className} ${h < 2 ? "bg-red-500/20 text-red-400 border border-red-500/30" : h < 5 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                  {h.toFixed(2)}×
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl relative">

          {/* Status badge */}
          <div className={`absolute top-4 left-4 flex items-center gap-2 z-10 ${fira.className}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${gameState === "crashed" ? "bg-red-500" : gameState === "cashed" ? "bg-emerald-500" : "bg-emerald-500"}`} />
            <span className={`text-xs uppercase tracking-widest font-bold ${status.color}`}>{status.text}</span>
          </div>

          {/* Giant multiplier overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className={`text-8xl md:text-9xl font-bold tabular-nums tracking-tighter transition-colors duration-300 drop-shadow-2xl ${getMultiplierColor()} ${space.className}`}
              style={{ textShadow: gameState === "running" ? "0 0 40px rgba(251,191,36,0.3)" : gameState === "crashed" ? "0 0 40px rgba(239,68,68,0.4)" : "0 0 40px rgba(52,211,153,0.4)" }}
            >
              {multiplier.toFixed(2)}×
            </div>
          </div>

          {/* SVG chart */}
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 260 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gameState === "crashed" ? "#ef4444" : "#fbbf24"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={gameState === "crashed" ? "#ef4444" : "#fbbf24"} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[1, 2, 5, 10].map(v => {
              if (v > maxY) return null;
              const { sy } = toSvg(0, v);
              return (
                <g key={v}>
                  <line x1={PAD} y1={sy} x2={W - PAD} y2={sy} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={PAD - 4} y={sy + 4} textAnchor="end" fill="#52525b" fontSize="10" fontFamily="monospace">{v}×</text>
                </g>
              );
            })}
            {/* Fill */}
            {fillD && <path d={fillD} fill="url(#chartGrad)" />}
            {/* Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={gameState === "crashed" ? "#ef4444" : "#fbbf24"}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* Dot at current position */}
            {chartPoints.length > 0 && (() => {
              const last = chartPoints[chartPoints.length - 1];
              const { sx, sy } = toSvg(last.x, last.y);
              return (
                <circle cx={sx} cy={sy} r="5" fill={gameState === "crashed" ? "#ef4444" : "#fbbf24"}
                  style={{ filter: `drop-shadow(0 0 6px ${gameState === "crashed" ? "#ef4444" : "#fbbf24"})` }}
                />
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
