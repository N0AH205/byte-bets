"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useBalance } from "@/context/BalanceContext";
import Matter from "matter-js";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PEG_SPACING = 40;

// Multiplier tables by risk level and row count
const MULTIPLIER_TABLES: Record<string, Record<number, number[]>> = {
  Low: {
    8:  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  Medium: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  High: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [141, 22, 5, 2, 0.9, 0.3, 0.1, 0.3, 0.9, 2, 5, 22, 141],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const ROW_OPTIONS = [8, 12, 16] as const;
type RiskLevel = "Low" | "Medium" | "High";

function getBinColor(mult: number, max: number): string {
  const ratio = mult / max;
  if (ratio >= 0.7) return "bg-red-500/80 text-white border-r border-red-900";
  if (ratio >= 0.3) return "bg-orange-500/80 text-white border-r border-orange-700";
  return "bg-yellow-500/80 text-black border-r border-yellow-700";
}

export default function PlinkoGame() {
  const { balance, debit, credit } = useBalance();
  const [betAmount, setBetAmount] = useState<string>("100");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("High");
  const [rows, setRows] = useState<16 | 12 | 8>(16);
  const [history, setHistory] = useState<number[]>([]);

  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const multipliers = MULTIPLIER_TABLES[riskLevel][rows];
  const maxMult = Math.max(...multipliers);

  // Refs to always read latest values inside Matter.js event callback
  const betRef = useRef(betAmount);
  const creditRef = useRef(credit);
  useEffect(() => { betRef.current = betAmount; }, [betAmount]);
  useEffect(() => { creditRef.current = credit; }, [credit]);

  // Rebuild the physics world when rows or riskLevel changes
  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create({ enableSleeping: false });
    engine.gravity.y = 1.0;
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: "transparent",
      },
    });

    // Build the Pyramid
    const pegs: Matter.Body[] = [];
    const startY = 30;
    const centerX = CANVAS_WIDTH / 2;

    for (let row = 2; row <= rows; row++) {
      const pegsInRow = row + 1;
      const startX = centerX - ((pegsInRow - 1) * PEG_SPACING) / 2;
      for (let i = 0; i < pegsInRow; i++) {
        pegs.push(
          Matter.Bodies.circle(startX + i * PEG_SPACING, startY + row * (CANVAS_HEIGHT / (rows + 2)), 4.5, {
            isStatic: true,
            restitution: 0.35,
            friction: 0.05,
            render: { fillStyle: "#a1a1aa" },
          })
        );
      }
    }

    // Funnel Walls
    const walls = [
      Matter.Bodies.rectangle(centerX - 360, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { isStatic: true, render: { visible: false } }),
      Matter.Bodies.rectangle(centerX + 360, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { isStatic: true, render: { visible: false } }),
    ];

    // Sensors mapped to bins
    const sensors: Matter.Body[] = [];
    const binsCount = rows + 1;
    const sensorStartX = centerX - ((binsCount - 1) * PEG_SPACING) / 2;
    const sensorY = CANVAS_HEIGHT - 10;

    for (let i = 0; i < binsCount; i++) {
      sensors.push(
        Matter.Bodies.rectangle(sensorStartX + i * PEG_SPACING, sensorY, PEG_SPACING - 4, 20, {
          isStatic: true,
          isSensor: true,
          label: `bin-${i}`,
          render: { visible: false },
        })
      );
    }

    Matter.Composite.add(engine.world, [...pegs, ...walls, ...sensors]);

    // Collision Logic
    Matter.Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const ball = bodyA.label === "ball" ? bodyA : bodyB.label === "ball" ? bodyB : null;
        const bin = bodyA.label.startsWith("bin-") ? bodyA : bodyB.label.startsWith("bin-") ? bodyB : null;

        if (ball && bin && !(ball as Matter.Body & { isScored?: boolean }).isScored) {
          (ball as Matter.Body & { isScored?: boolean }).isScored = true;
          Matter.Composite.remove(engine.world, ball);
          const binIndex = parseInt(bin.label.split("-")[1]);
          const mults = MULTIPLIER_TABLES[riskLevel][rows];
          const multiplier = mults[binIndex] ?? 0;
          const bet = Number(betRef.current);
          const payout = bet * multiplier;

          setHistory((prev) => [multiplier, ...prev].slice(0, 11));
          if (payout > 0) creditRef.current(payout);
        }
      });
    });

    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
      engineRef.current = null;
    };
  }, [rows, riskLevel]);

  const handleDrop = useCallback(() => {
    if (!engineRef.current) return;
    const bet = Number(betAmount);
    if (bet <= 0 || bet > balance) return;
    const success = debit(bet);
    if (!success) return;

    const randomOffset = (Math.random() - 0.5) * 6;
    const ball = Matter.Bodies.circle(CANVAS_WIDTH / 2 + randomOffset, 10, 7.5, {
      restitution: 0.4,
      frictionAir: 0.02,
      density: 0.05,
      label: "ball",
      collisionFilter: { group: -1 },
      render: { fillStyle: "#fbbf24" },
    });
    Matter.Composite.add(engineRef.current.world, ball);
  }, [betAmount, balance, debit]);

  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>
            BYTE BETS <span className="text-[#fbbf24]">Plinko</span>
          </h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>Physics-based byte cascade.</p>
        </div>
        <div className={`text-right ${fira.className}`}>
          <div className="text-xs text-zinc-500 uppercase">Wallet Balance</div>
          <div className="text-emerald-500 text-lg font-bold tracking-widest">
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6">

        {/* Left Side: Controls */}
        <div className="w-full xl:w-80 bg-[#18181b] border border-zinc-800 rounded-lg p-6 flex flex-col justify-between shadow-2xl relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#fbbf24] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#fbbf24] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#fbbf24] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#fbbf24] rounded-br-lg" />

          <div className="space-y-6">
            {/* Bet Amount */}
            <div>
              <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Bet Amount</label>
              <div className="flex items-center bg-[#09090b] border border-zinc-700 rounded focus-within:border-[#fbbf24] transition-colors">
                <span className="pl-3 text-zinc-500">$</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className={`w-full bg-transparent text-zinc-200 p-3 outline-none ${fira.className}`}
                />
                <button
                  onClick={() => setBetAmount(String(Math.max(1, Math.floor(Number(betAmount) / 2))))}
                  className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] transition-colors"
                >½</button>
                <button
                  onClick={() => setBetAmount(String(Math.min(balance, Number(betAmount) * 2)))}
                  className="px-3 text-xs text-zinc-500 hover:text-[#fbbf24] border-l border-zinc-800 transition-colors"
                >2×</button>
              </div>
            </div>

            {/* Risk Level */}
            <div>
              <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Risk Level</label>
              <div className="flex gap-1">
                {(["Low", "Medium", "High"] as RiskLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRiskLevel(lvl)}
                    className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${fira.className} ${
                      riskLevel === lvl
                        ? "bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50"
                        : "bg-[#09090b] text-zinc-500 border border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              <label className={`block text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>Rows</label>
              <div className="flex gap-1">
                {ROW_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRows(r)}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${fira.className} ${
                      rows === r
                        ? "bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50"
                        : "bg-[#09090b] text-zinc-500 border border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Max multiplier info */}
            <div className={`bg-[#09090b] border border-zinc-800 rounded p-3 ${fira.className}`}>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Max Multiplier</span>
                <span className="text-red-400 font-bold">{maxMult}×</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">Max Win</span>
                <span className="text-emerald-400">${(Number(betAmount) * maxMult).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">Bins</span>
                <span className="text-zinc-300">{multipliers.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDrop}
            disabled={Number(betAmount) <= 0 || Number(betAmount) > balance}
            className={`w-full py-4 mt-8 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${space.className}`}
          >
            DROP PAYLOAD
          </button>
        </div>

        {/* Right Side: Visual Container */}
        <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-lg flex items-center justify-center overflow-x-auto relative">

          <div className="relative w-[800px] h-[600px] flex-shrink-0">
            {/* Matter.js Canvas */}
            <div ref={sceneRef} className="absolute inset-0 z-10 pointer-events-none" />

            {/* Visual Bins */}
            <div
              className="absolute bottom-[0px] flex z-20 overflow-hidden rounded-t-sm shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
              style={{
                left: `${CANVAS_WIDTH / 2 - (multipliers.length * PEG_SPACING) / 2}px`,
                width: `${multipliers.length * PEG_SPACING}px`,
                height: "30px",
              }}
            >
              {multipliers.map((mult, i) => (
                <div
                  key={i}
                  style={{ width: `${PEG_SPACING}px` }}
                  className={`h-full flex items-center justify-center text-[10px] font-bold backdrop-blur-md ${fira.className} ${getBinColor(mult, maxMult)} last:border-r-0`}
                >
                  {mult}×
                </div>
              ))}
            </div>
          </div>

          {/* Floating History Column */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 w-14 z-20 hidden md:flex">
            {history.map((mult, i) => {
              const ratio = mult / maxMult;
              let bgColor = "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
              if (ratio >= 0.7) bgColor = "bg-red-500/20 text-red-500 border border-red-500/30";
              else if (ratio >= 0.3) bgColor = "bg-orange-500/20 text-orange-500 border border-orange-500/30";
              return (
                <div
                  key={i}
                  className={`w-full py-2 rounded flex items-center justify-center text-xs font-bold ${fira.className} ${bgColor} transition-all duration-300 ${i === 0 ? "scale-110" : "opacity-50"}`}
                >
                  {mult}×
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}