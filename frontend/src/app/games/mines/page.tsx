"use client";

import { useState, useCallback } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useBalance } from "@/context/BalanceContext";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

const GRID_SIZE = 25; // 5x5
const DEFAULT_MINES = 5;

type CellState = "hidden" | "revealed" | "mine";

interface Cell {
  isMine: boolean;
  state: CellState;
}

type GameState = "idle" | "playing" | "won" | "dead";

function calcMultiplier(totalCells: number, mines: number, revealed: number): number {
  // Standard Mines multiplier with house edge ~3%
  if (revealed === 0) return 1.0;
  let m = 1.0;
  for (let i = 0; i < revealed; i++) {
    const safe = totalCells - mines - i;
    const remaining = totalCells - i;
    m *= remaining / safe;
  }
  return m * 0.97;
}

function buildGrid(mineCount: number): Cell[] {
  const grid: Cell[] = Array.from({ length: GRID_SIZE }, () => ({ isMine: false, state: "hidden" as CellState }));
  let placed = 0;
  while (placed < mineCount) {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    if (!grid[idx].isMine) {
      grid[idx].isMine = true;
      placed++;
    }
  }
  return grid;
}

export default function MinesGame() {
  const { balance, debit, credit } = useBalance();
  const [betAmount, setBetAmount] = useState<string>("100");
  const [mineCount, setMineCount] = useState<number>(DEFAULT_MINES);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [revealed, setRevealed] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [explodedIdx, setExplodedIdx] = useState<number | null>(null);

  const multiplier = calcMultiplier(GRID_SIZE, mineCount, revealed);
  const potentialWin = Number(betAmount) * multiplier;

  const startGame = useCallback(() => {
    const bet = Number(betAmount);
    if (bet <= 0 || bet > balance) return;
    const success = debit(bet);
    if (!success) return;
    setGrid(buildGrid(mineCount));
    setGameState("playing");
    setRevealed(0);
    setLastWin(null);
    setExplodedIdx(null);
  }, [betAmount, balance, mineCount, debit]);

  const handleReveal = useCallback((idx: number) => {
    if (gameState !== "playing" || grid[idx].state !== "hidden") return;

    const cell = grid[idx];
    const newGrid = grid.map((c, i) => i === idx ? { ...c, state: "revealed" as CellState } : c);

    if (cell.isMine) {
      // Reveal all mines with animation
      const explodedGrid = newGrid.map(c => c.isMine ? { ...c, state: "mine" as CellState } : c);
      setGrid(explodedGrid);
      setExplodedIdx(idx);
      setGameState("dead");
    } else {
      const newRevealed = revealed + 1;
      setGrid(newGrid);
      setRevealed(newRevealed);

      // Win if all safe cells revealed
      const safeCount = GRID_SIZE - mineCount;
      if (newRevealed >= safeCount) {
        const win = Number(betAmount) * calcMultiplier(GRID_SIZE, mineCount, newRevealed);
        credit(win);
        setLastWin(win);
        setGameState("won");
      }
    }
  }, [gameState, grid, revealed, betAmount, mineCount, credit]);

  const handleCashout = () => {
    if (gameState !== "playing" || revealed === 0) return;
    const win = potentialWin;
    credit(win);
    setLastWin(win);
    // Reveal all mines on cashout
    setGrid(prev => prev.map(c => c.isMine ? { ...c, state: "mine" as CellState } : c));
    setGameState("won");
  };

  const getCellStyle = (cell: Cell, idx: number) => {
    if (cell.state === "mine") {
      const isOrigin = idx === explodedIdx;
      return `bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] ${
        isOrigin ? "animate-bounce scale-110" : "scale-105"
      }`;
    }
    if (cell.state === "revealed") {
      return "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
    }
    if (gameState === "playing") {
      return "bg-[#09090b] border-zinc-700 hover:border-[#fbbf24] hover:bg-[#fbbf24]/5 hover:shadow-[0_0_10px_rgba(251,191,36,0.2)] cursor-pointer active:scale-95";
    }
    return "bg-[#09090b] border-zinc-800 opacity-60";
  };

  const MINE_COUNTS = [1, 3, 5, 10, 15, 20, 24];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>
            BYTE BETS <span className="text-[#fbbf24]">Mines</span>
          </h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>
            Clear the board but avoid the mines.
          </p>
        </div>
        <div className={`text-right ${fira.className}`}>
          <div className="text-xs text-zinc-500 uppercase">Wallet Balance</div>
          <div className="text-emerald-500 text-lg font-bold tracking-widest">
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col xl:flex-row gap-6">

        {/* Left: Controls */}
        <div className="w-full xl:w-72 bg-[#18181b] border border-zinc-800 rounded-lg p-6 flex flex-col gap-5 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#fbbf24] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#fbbf24] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#fbbf24] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#fbbf24] rounded-br-lg" />

          {/* Bet amount */}
          <div>
            <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Bet Amount</label>
            <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors">
              <span className="pl-3 text-zinc-500">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={gameState === "playing"}
                className={`w-full bg-transparent text-zinc-200 p-3 outline-none disabled:opacity-50 ${fira.className}`}
              />
              <button onClick={() => setBetAmount(String(Number(betAmount) / 2))} className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24]">½</button>
              <button onClick={() => setBetAmount(String(Number(betAmount) * 2))} className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] border-l border-zinc-800">2×</button>
            </div>
          </div>

          {/* Mine count */}
          <div>
            <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Mines</label>
            <div className="grid grid-cols-4 gap-1">
              {MINE_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setMineCount(n)}
                  disabled={gameState === "playing"}
                  className={`py-2 rounded text-xs font-bold transition-colors ${fira.className} ${mineCount === n ? "bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50" : "bg-[#09090b] text-zinc-500 border border-zinc-700 hover:border-zinc-500 disabled:opacity-50"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Stats panel */}
          <div className={`bg-[#09090b] border border-zinc-800 rounded p-4 space-y-2 ${fira.className}`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Mines</span>
              <span className="text-red-400">{mineCount} LIVE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Revealed</span>
              <span className="text-zinc-300">{revealed} / {GRID_SIZE - mineCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Multiplier</span>
              <span className="text-[#fbbf24]">{multiplier.toFixed(2)}×</span>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-800 pt-2">
              <span className="text-zinc-500">Potential Win</span>
              <span className="text-emerald-400">${potentialWin.toFixed(2)}</span>
            </div>
          </div>

          {/* Result banner */}
          {(gameState === "dead" || gameState === "won") && (
            <div className={`p-3 rounded border text-center ${fira.className} ${gameState === "won" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
              {gameState === "won"
                ? `+$${lastWin?.toFixed(2)} Won!`
                : "BOOM! Mine hit."}
            </div>
          )}

          {/* Action button */}
          {gameState === "playing" ? (
            <button
              onClick={handleCashout}
              disabled={revealed === 0}
              className={`w-full py-4 text-white font-bold uppercase tracking-widest rounded bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border-b-4 border-emerald-900 hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${space.className}`}
            >
              CASH OUT ${potentialWin.toFixed(2)}
            </button>
          ) : (
            <button
              onClick={startGame}
              disabled={Number(betAmount) <= 0 || Number(betAmount) > balance}
              className={`w-full py-4 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${space.className}`}
            >
              {gameState === "idle" ? "START GAME" : "PLAY AGAIN"}
            </button>
          )}
        </div>

        {/* Right: Grid */}
        <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center gap-6 shadow-2xl">

          {/* Multiplier */}
          <div className={`text-center ${fira.className}`}>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Current Multiplier</div>
            <div className={`text-5xl font-bold tabular-nums ${space.className} ${revealed > 0 ? "text-[#fbbf24]" : "text-zinc-600"}`}
              style={{ textShadow: revealed > 0 ? "0 0 30px rgba(251,191,36,0.4)" : "none" }}>
              {multiplier.toFixed(2)}×
            </div>
          </div>

          {/* 5×5 grid */}
          {gameState === "idle" ? (
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: GRID_SIZE }).map((_, i) => (
                <div key={i} className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#09090b] border border-zinc-800 flex items-center justify-center opacity-30">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
                {grid.map((cell, i) => (
                  <button
                    key={i}
                    onClick={() => handleReveal(i)}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${getCellStyle(cell, i)}`}
                  >
                  {cell.state === "mine" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={i === explodedIdx ? "animate-ping" : ""}>
                      <circle cx="12" cy="12" r="6" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="5" y1="5" x2="8" y2="8" />
                      <line x1="16" y1="16" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="16" y2="8" />
                      <line x1="8" y1="16" x2="5" y2="19" />
                    </svg>
                  )}
                  {cell.state === "revealed" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {cell.state === "hidden" && (
                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Instructions */}
          {gameState === "idle" && (
            <p className={`text-zinc-600 text-sm text-center ${fira.className}`}>
              Set your bet and mines count, then start to reveal cells.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
