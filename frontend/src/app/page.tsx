"use client";

import Background3D from "@/components/Background3D";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500"] });

export default function Home() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/games');
    }
  }, [isConnected, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <Background3D />

      <nav className={`absolute top-0 w-full p-8 flex justify-between items-center z-20 ${space.className}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#fbbf24] to-[#b45309] rounded-sm shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center justify-center font-bold text-[#09090b]">
            B
          </div>
          <span className="text-xl font-bold tracking-widest text-zinc-200">BYTE BETS</span>
        </div>
        <div className={`hidden md:flex gap-8 text-sm text-zinc-400 ${fira.className}`}>
          {isConnected ? (
            <Link href="/games" className="hover:text-[#fbbf24] transition-colors">Games</Link>
          ) : (
            <button onClick={() => open()} className="hover:text-[#fbbf24] transition-colors uppercase tracking-widest">Games</button>
          )}
          <button onClick={() => !isConnected && open()} className="hover:text-[#fbbf24] transition-colors uppercase tracking-widest">Audit</button>
          <button onClick={() => !isConnected && open()} className="hover:text-[#fbbf24] transition-colors uppercase tracking-widest">Leaderboard</button>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-lg mt-12 bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800 rounded-lg shadow-2xl p-1">
        <div className={`flex items-center gap-2 px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 rounded-t-lg ${fira.className}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
          <span className="text-xs text-emerald-500/80 uppercase tracking-wider">Server Online</span>
        </div>

        <div className="p-8 md:p-10 text-center space-y-8">
          <h1 className={`text-5xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#fbbf24] to-[#b45309] ${space.className}`}>
            BYTE BETS
          </h1>
          
          <div className={`space-y-2 ${fira.className}`}>
            <p className="text-zinc-400 text-sm">
              The high-end arena for provably fair gaming.
            </p>
            <p className="text-zinc-500 text-xs">
              Connect your wallet to enter.
            </p>
          </div>

          <button 
            onClick={() => open()}
            className={`w-full py-4 mt-6 flex items-center justify-center gap-3 text-[#09090b] font-bold uppercase tracking-widest rounded bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#d97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_4px_15px_rgba(251,191,36,0.2)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_0_25px_rgba(251,191,36,0.4)] border-b-4 border-[#b45309] hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all ${space.className}`}
          >
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}