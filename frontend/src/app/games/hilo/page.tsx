"use client";

import { useState, useCallback } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useBalance } from "@/context/BalanceContext";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Suit = typeof SUITS[number];
type Rank = typeof RANKS[number];

interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // A=1, 2-10, J=11, Q=12, K=13
}

type GameState = "idle" | "playing" | "won" | "lost";
type Prediction = "higher" | "lower" | null;

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({ suit, rank: RANKS[i], value: i + 1 });
    }
  }
  return deck;
}

function drawCard(deck: Card[]): { card: Card; deck: Card[] } {
  const idx = Math.floor(Math.random() * deck.length);
  const card = deck[idx];
  return { card, deck: deck.filter((_, i) => i !== idx) };
}

function isRed(suit: Suit) {
  return suit === "♥" || suit === "♦";
}

// Probability-based multiplier with 3% house edge
function calcMultiplier(currentValue: number, prediction: Prediction, deckSize: number): number {
  if (!prediction) return 1.0;
  const remaining = deckSize;
  let favorable = 0;
  for (let v = 1; v <= 13; v++) {
    const countInDeck = 4; // simplified; each value has 4 cards
    if (prediction === "higher" && v > currentValue) favorable += countInDeck;
    if (prediction === "lower" && v < currentValue) favorable += countInDeck;
  }
  const prob = favorable / (remaining * 4); // rough estimate
  if (prob <= 0 || prob > 1) return 1.0;
  return Math.max(1.0, (1 / prob) * 0.97);
}

export default function HiLoGame() {
  const { balance, debit, credit } = useBalance();
  const [betAmount, setBetAmount] = useState<string>("100");
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [previousCards, setPreviousCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [streak, setStreak] = useState<number>(0);
  const [totalMultiplier, setTotalMultiplier] = useState<number>(1.0);
  const [pendingPrediction, setPendingPrediction] = useState<Prediction>(null);
  const [lastResult, setLastResult] = useState<{ won: boolean; multiplier: number } | null>(null);

  const startGame = useCallback(() => {
    const bet = Number(betAmount);
    if (bet <= 0 || bet > balance) return;
    const success = debit(bet);
    if (!success) return;
    const fullDeck = buildDeck();
    const { card, deck: remaining } = drawCard(fullDeck);
    setDeck(remaining);
    setCurrentCard(card);
    setPreviousCards([]);
    setGameState("playing");
    setStreak(0);
    setTotalMultiplier(1.0);
    setPendingPrediction(null);
    setLastResult(null);
  }, [betAmount, balance, debit]);

  const handlePrediction = useCallback((prediction: Prediction) => {
    if (gameState !== "playing" || !currentCard) return;

    const { card: nextCard, deck: newDeck } = drawCard(deck);

    const won = prediction === "higher"
      ? nextCard.value > currentCard.value
      : nextCard.value < currentCard.value;

    // Tie = loss
    if (nextCard.value === currentCard.value) {
      setCurrentCard(nextCard);
      setPreviousCards(prev => [currentCard, ...prev].slice(0, 5));
      setDeck(newDeck);
      setLastResult({ won: false, multiplier: 0 });
      setGameState("lost");
      return;
    }

    const roundMultiplier = calcMultiplier(currentCard.value, prediction, deck.length);

    if (won) {
      const newTotal = totalMultiplier * roundMultiplier;
      setTotalMultiplier(newTotal);
      setStreak(prev => prev + 1);
      setPreviousCards(prev => [currentCard, ...prev].slice(0, 5));
      setCurrentCard(nextCard);
      setDeck(newDeck);
      setLastResult({ won: true, multiplier: roundMultiplier });
      setPendingPrediction(null);
    } else {
      setPreviousCards(prev => [currentCard, ...prev].slice(0, 5));
      setCurrentCard(nextCard);
      setDeck(newDeck);
      setLastResult({ won: false, multiplier: 0 });
      setGameState("lost");
    }
  }, [gameState, currentCard, deck, totalMultiplier]);

  const handleCashout = () => {
    if (gameState !== "playing" || streak === 0) return;
    const winAmount = Number(betAmount) * totalMultiplier;
    credit(winAmount);
    setLastResult({ won: true, multiplier: totalMultiplier });
    setGameState("won");
  };

  const CardDisplay = ({ card, dim = false }: { card: Card; dim?: boolean }) => (
    <div className={`relative w-20 h-28 md:w-24 md:h-36 bg-white rounded-xl border-2 flex flex-col justify-between p-2 shadow-xl transition-all duration-300 ${dim ? "opacity-40 scale-90" : "border-zinc-300"} ${isRed(card.suit) ? "text-red-600" : "text-zinc-900"}`}>
      <div className="text-left">
        <div className={`text-lg font-black leading-none ${fira.className}`}>{card.rank}</div>
        <div className="text-xl leading-none">{card.suit}</div>
      </div>
      <div className="text-center text-4xl leading-none">{card.suit}</div>
      <div className="text-right rotate-180">
        <div className={`text-lg font-black leading-none ${fira.className}`}>{card.rank}</div>
        <div className="text-xl leading-none">{card.suit}</div>
      </div>
    </div>
  );

  const rankName = (v: number) => RANKS[v - 1];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>
            BYTE BETS <span className="text-[#fbbf24]">Hi-Lo</span>
          </h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>
            Guess if the next card is higher or lower.
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

          {/* Stats */}
          <div className={`bg-[#09090b] border border-zinc-800 rounded p-4 space-y-2 ${fira.className}`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Streak</span>
              <span className="text-[#fbbf24]">{streak}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Total Multiplier</span>
              <span className="text-[#fbbf24]">{totalMultiplier.toFixed(2)}×</span>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-800 pt-2">
              <span className="text-zinc-500">Potential Win</span>
              <span className="text-emerald-400">${(Number(betAmount) * totalMultiplier).toFixed(2)}</span>
            </div>
          </div>

          {/* Last round result — only show win feedback while still playing */}
          {lastResult && lastResult.won && gameState === "playing" && (
            <div className={`p-2 rounded border text-center text-sm ${fira.className} bg-emerald-500/10 border-emerald-500/30 text-emerald-400`}>
              +{lastResult.multiplier.toFixed(2)}× Round Win!
            </div>
          )}

          {/* Final game result */}
          {(gameState === "won" || gameState === "lost") && (
            <div className={`p-3 rounded border text-center ${fira.className} ${gameState === "won" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
              {gameState === "won"
                ? `✓ Cashed out! +$${(Number(betAmount) * totalMultiplier).toFixed(2)}`
                : "✗ Wrong guess — you lost."}
            </div>
          )}

          {/* Deck info */}
          {gameState === "playing" && (
            <div className={`text-xs text-zinc-600 text-center ${fira.className}`}>
              {deck.length} cards remaining in deck
            </div>
          )}

          {/* Cash out button */}
          {gameState === "playing" && streak > 0 && (
            <button
              onClick={handleCashout}
              className={`w-full py-3 text-white font-bold uppercase tracking-widest rounded bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border-b-4 border-emerald-900 hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all ${space.className}`}
            >
              CASH OUT ${(Number(betAmount) * totalMultiplier).toFixed(2)}
            </button>
          )}

          {/* Start / Restart button */}
          {gameState !== "playing" && (
            <button
              onClick={startGame}
              disabled={Number(betAmount) <= 0 || Number(betAmount) > balance}
              className={`w-full py-4 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${space.className}`}
            >
              {gameState === "idle" ? "DEAL CARDS" : "PLAY AGAIN"}
            </button>
          )}
        </div>

        {/* Right: Game arena */}
        <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-lg p-6 md:p-10 flex flex-col items-center justify-center gap-8 shadow-2xl">

          {gameState === "idle" ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="2" y1="9" x2="22" y2="9" />
                  <line x1="2" y1="15" x2="22" y2="15" />
                </svg>
              </div>
              <p className={`text-zinc-500 text-sm ${fira.className}`}>Place your bet and deal to start.</p>
            </div>
          ) : (
            <>
              {/* Previous cards row */}
              {previousCards.length > 0 && (
                <div className="flex gap-2 items-center">
                  {previousCards.map((c, i) => (
                    <CardDisplay key={i} card={c} dim />
                  ))}
                </div>
              )}

              {/* Current card */}
              {currentCard && (
                <div className="flex flex-col items-center gap-4">
                  <div className={`text-xs text-zinc-500 uppercase tracking-widest ${fira.className}`}>Current Card</div>
                  <div className="relative">
                    <CardDisplay card={currentCard} />
                  </div>

                  {/* Card description */}
                  <div className={`text-zinc-400 text-sm ${fira.className}`}>
                    <span className={isRed(currentCard.suit) ? "text-red-400" : "text-zinc-300"}>{currentCard.rank} of {currentCard.suit === "♠" ? "Spades" : currentCard.suit === "♥" ? "Hearts" : currentCard.suit === "♦" ? "Diamonds" : "Clubs"}</span>
                    <span className="text-zinc-600 ml-2">(Value: {currentCard.value})</span>
                  </div>
                </div>
              )}

              {/* Prediction buttons */}
              {gameState === "playing" && currentCard && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePrediction("lower")}
                    className={`px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all border-2 ${space.className} ${currentCard.value === 1 ? "opacity-30 cursor-not-allowed border-zinc-700 text-zinc-700" : "border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95"}`}
                    disabled={currentCard.value === 1}
                  >
                    ↓ LOWER
                  </button>
                  <button
                    onClick={() => handlePrediction("higher")}
                    className={`px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all border-2 ${space.className} ${currentCard.value === 13 ? "opacity-30 cursor-not-allowed border-zinc-700 text-zinc-700" : "border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95"}`}
                    disabled={currentCard.value === 13}
                  >
                    ↑ HIGHER
                  </button>
                </div>
              )}

              {/* Round multiplier preview */}
              {gameState === "playing" && currentCard && (
                <div className={`flex gap-6 text-sm text-center ${fira.className}`}>
                  <div>
                    <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Lower Multiplier</div>
                    <div className="text-blue-400 font-bold">{calcMultiplier(currentCard.value, "lower", deck.length).toFixed(2)}×</div>
                  </div>
                  <div className="w-px bg-zinc-800" />
                  <div>
                    <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Higher Multiplier</div>
                    <div className="text-red-400 font-bold">{calcMultiplier(currentCard.value, "higher", deck.length).toFixed(2)}×</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
