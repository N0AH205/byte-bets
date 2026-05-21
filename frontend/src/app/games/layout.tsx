"use client";

import { useState, useEffect } from "react";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useBalance } from "@/context/BalanceContext";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"] });
const fira = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"] });

const NAV_LINKS = [
  { name: "All Games", href: "/games" },
  { name: "Crypto Dice", href: "/games/dice" },
  { name: "Plinko", href: "/games/plinko" },
  { name: "Crash", href: "/games/crash" },
  { name: "Mines", href: "/games/mines" },
  { name: "Hi-Lo", href: "/games/hilo" },
];

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { balance } = useBalance();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-200 overflow-hidden">
      
      <header className="h-[72px] flex-shrink-0 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between px-6 z-50 relative shadow-md">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className={`flex items-center gap-3 group cursor-pointer ${space.className}`}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#fbbf24] to-[#b45309] rounded-sm flex items-center justify-center font-bold text-[#09090b] shadow-[0_0_15px_rgba(251,191,36,0.3)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all">
            B
          </div>
          <span className="text-2xl font-bold tracking-widest text-zinc-200 group-hover:text-[#fbbf24] transition-colors">
            BYTE BETS
          </span>
        </button>

        <div className={`flex items-center gap-2 text-xs text-emerald-500 font-bold tracking-widest hidden sm:flex ${fira.className}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          CONNECTED
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm top-[72px]"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <aside 
          className={`absolute md:relative top-0 left-0 h-full bg-[#18181b] border-r border-zinc-800 z-40 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          }`}
        >
          <div className="w-64 h-full flex flex-col justify-between">
            <div className="overflow-y-auto py-6 flex-1">
              <div className={`px-6 mb-4 text-xs font-bold text-zinc-500 tracking-widest uppercase ${fira.className}`}>
                Games Menu
              </div>
              <nav className="space-y-1 px-3">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`block px-3 py-2 rounded transition-colors text-sm ${fira.className} ${
                        isActive 
                          ? "bg-[#fbbf24]/10 text-[#fbbf24] border-l-2 border-[#fbbf24]" 
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-l-2 border-transparent"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className={`px-6 mt-8 mb-4 text-xs font-bold text-zinc-500 tracking-widest uppercase ${fira.className}`}>
                Account
              </div>
              <nav className="space-y-1 px-3">
                <Link 
                  href="/games/referrals"
                  className={`block px-3 py-2 rounded transition-colors text-sm ${fira.className} ${
                    pathname === "/games/referrals"
                      ? "bg-[#fbbf24]/10 text-[#fbbf24] border-l-2 border-[#fbbf24]" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-l-2 border-transparent"
                  }`}
                >
                  Referrals
                </Link>
              </nav>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex flex-col gap-2 flex-shrink-0">
              {/* Live Balance */}
              <div className={`flex items-center justify-between px-3 py-2 bg-[#09090b] border border-zinc-800 rounded ${fira.className}`}>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">Balance</span>
                <span className="text-emerald-400 font-bold text-sm tracking-widest">${balance.toFixed(2)}</span>
              </div>
              {isConnected ? (
                <>
                  <button
                    onClick={() => open()}
                    className={`w-full py-3 px-3 flex items-center justify-between bg-zinc-800/50 border border-zinc-700 hover:border-[#fbbf24]/50 rounded transition-colors text-xs ${fira.className}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-zinc-300">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                    <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Wallet</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      disconnect();
                      router.push('/');
                    }}
                    className={`w-full py-3 px-3 flex items-center justify-center text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors text-xs font-bold tracking-widest ${fira.className}`}
                  >
                    DISCONNECT
                  </button>
                </>
              ) : (
                <button
                  onClick={() => open()}
                  className={`w-full py-3 bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 hover:bg-[#fbbf24]/20 rounded text-xs font-bold tracking-widest transition-colors ${fira.className}`}
                >
                  CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 relative overflow-y-auto">
          <div 
            className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          ></div>
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}