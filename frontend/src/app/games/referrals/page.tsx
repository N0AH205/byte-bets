"use client";

import { useState, useCallback } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useAccount } from "wagmi";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });


const TIERS = [
  { name: "BRONZE",   min: 0,   max: 4,  rate: "1.0%", color: "#b45309", glow: "rgba(180,83,9,0.3)",     bgClass: "bg-amber-900/20 border-amber-800/40" },
  { name: "SILVER",   min: 5,   max: 14, rate: "1.5%", color: "#a1a1aa", glow: "rgba(161,161,170,0.3)",  bgClass: "bg-zinc-700/20 border-zinc-600/40" },
  { name: "GOLD",     min: 15,  max: 29, rate: "2.0%", color: "#fbbf24", glow: "rgba(251,191,36,0.3)",   bgClass: "bg-yellow-500/10 border-yellow-500/30" },
  { name: "PLATINUM", min: 30,  max: Infinity, rate: "2.5%", color: "#67e8f9", glow: "rgba(103,232,249,0.3)", bgClass: "bg-cyan-500/10 border-cyan-500/30" },
];

function getTier(referralCount: number) {
  return TIERS.find(t => referralCount >= t.min && referralCount <= t.max) ?? TIERS[0];
}

export default function ReferralsPage() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const referralCode = address
    ? `BB-${address.slice(2, 8).toUpperCase()}`
    : "BB-DEMO01";

  const referralLink = `https://bytebets.io/ref/${referralCode}`;

  const totalReferrals = 0;
  const totalWagered   = 0;
  const totalEarned    = 0;
  const activeRefs     = 0;
  const tier           = getTier(totalReferrals);
  const nextTier       = TIERS[TIERS.indexOf(tier) + 1];
  const progress       = nextTier
    ? Math.min(100, ((totalReferrals - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  const cornerBrackets = (
    <>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#fbbf24] rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#fbbf24] rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#fbbf24] rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#fbbf24] rounded-br-lg" />
    </>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">

      {/* Header */}
      <div className="w-full mb-8 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className={`text-4xl font-bold text-zinc-100 uppercase ${space.className}`}>
            BYTE BETS <span className="text-[#fbbf24]">Referrals</span>
          </h1>
          <p className={`text-zinc-500 text-sm mt-1 ${fira.className}`}>
            Earn commission on every wager your referrals make.
          </p>
        </div>
        {/* Current tier badge */}
        <div
          className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-lg border ${tier.bgClass} ${fira.className}`}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: tier.color }} />
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: tier.color }}>
            {tier.name} TIER
          </span>
          <span className="text-zinc-500 text-xs">{tier.rate} commission</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* Top row: Link + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Referral Link Card */}
          <div className="lg:col-span-2 bg-[#18181b] border border-zinc-800 rounded-lg p-6 relative shadow-2xl">
            {cornerBrackets}
            <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-3 ${fira.className}`}>Your Referral Link</div>

            <div className="flex gap-2 mb-4">
              <div className={`flex-1 bg-[#09090b] border border-zinc-700 rounded px-4 py-3 text-sm text-zinc-300 truncate ${fira.className}`}>
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className={`px-5 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 hover:bg-[#fbbf24]/20"
                } ${fira.className}`}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Referral Code */}
            <div className="flex items-center gap-4">
              <div>
                <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-1 ${fira.className}`}>Referral Code</div>
                <div className={`text-2xl font-bold tracking-widest text-[#fbbf24] ${space.className}`}>{referralCode}</div>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className={`text-xs text-zinc-500 leading-relaxed ${fira.className}`}>
                Share your link or code.<br />
                Earn {tier.rate} of every wager your referrals place.
              </div>
            </div>
          </div>

          {/* Tier Progress Card */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-6 relative shadow-2xl">
            {cornerBrackets}
            <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-4 ${fira.className}`}>Tier Progress</div>

            {/* Tier badges */}
            <div className="space-y-2 mb-5">
              {TIERS.map((t) => {
                const isActive = t.name === tier.name;
                return (
                  <div
                    key={t.name}
                    className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${isActive ? t.bgClass : "bg-transparent border-transparent opacity-40"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                      <span className={`text-xs font-bold uppercase tracking-widest ${fira.className}`} style={{ color: isActive ? t.color : "#52525b" }}>
                        {t.name}
                      </span>
                    </div>
                    <span className={`text-xs ${fira.className}`} style={{ color: isActive ? t.color : "#52525b" }}>
                      {t.rate}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            {nextTier && (
              <div>
                <div className={`flex justify-between text-xs text-zinc-500 mb-2 ${fira.className}`}>
                  <span>{totalReferrals} referrals</span>
                  <span>{nextTier.min} for {nextTier.name}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})` }}
                  />
                </div>
              </div>
            )}
            {!nextTier && (
              <div className={`text-xs text-cyan-400 text-center ${fira.className}`}>
                Max tier reached — 2.5% commission
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Referrals",  value: totalReferrals,            suffix: "",  color: "text-zinc-100" },
            { label: "Active Users",     value: activeRefs,                suffix: "",  color: "text-emerald-400" },
            { label: "Total Wagered",    value: `$${totalWagered.toLocaleString()}`, suffix: "", color: "text-[#fbbf24]" },
            { label: "Total Earned",     value: `$${totalEarned.toFixed(2)}`,         suffix: "", color: "text-[#fbbf24]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#18181b] border border-zinc-800 rounded-lg p-5 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#fbbf24]/50 rounded-tl-lg" />
              <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-2 ${fira.className}`}>{stat.label}</div>
              <div className={`text-2xl font-bold tabular-nums ${stat.color} ${space.className}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Referred Users Table */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl relative">
          {cornerBrackets}

          <div className={`px-6 py-4 border-b border-zinc-800 flex justify-between items-center ${fira.className}`}>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Referred Users</div>
            <div className="flex items-center gap-2 text-xs text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeRefs} Active
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  {["Wallet", "Joined", "Total Wagered", "Commission Earned", "Status"].map(h => (
                    <th key={h} className={`px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-widest ${fira.className}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className={`px-6 py-12 text-center ${fira.className}`}>
                    <div className="flex flex-col items-center gap-3">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-zinc-600 text-xs uppercase tracking-widest">No referrals yet</span>
                      <span className="text-zinc-700 text-xs">Share your link above to start earning</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={`px-6 py-4 border-t border-zinc-800/50 flex justify-between items-center ${fira.className}`}>
            <span className="text-xs text-zinc-600">0 referred users</span>
            <span className="text-xs text-zinc-600">Commission rate: {tier.rate} per wager</span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-6 shadow-2xl relative">
          {cornerBrackets}
          <div className={`text-xs text-zinc-500 uppercase tracking-widest mb-5 ${fira.className}`}>How It Works</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Share Your Link",
                desc: "Copy your unique referral link and share it with friends, on social media, or in communities.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "They Sign Up & Play",
                desc: "When someone connects their wallet using your referral, they're linked to your account permanently.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Earn Commission",
                desc: "You earn a percentage of every wager they place — forever. Grow your tier to unlock higher rates.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-lg flex items-center justify-center text-[#fbbf24]">
                  {item.icon}
                </div>
                <div>
                  <div className={`text-xs text-zinc-600 uppercase tracking-widest mb-1 ${fira.className}`}>Step {item.step}</div>
                  <div className={`text-sm font-bold text-zinc-200 mb-1 ${space.className}`}>{item.title}</div>
                  <div className={`text-xs text-zinc-500 leading-relaxed ${fira.className}`}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
