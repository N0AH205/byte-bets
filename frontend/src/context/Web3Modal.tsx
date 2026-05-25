"use client";

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, sepolia } from 'wagmi/chains';

// 1. Get a free projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_W3M_PROJECT_ID || 'b56e18d47c72ab683b108151966d6bea';

// 2. Set up the metadata for when users connect
const metadata = {
  name: 'Byte Bets',
  description: 'The high-end arena for provably fair gaming.',
  url: 'https://bytebets.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 3. Configure Wagmi
const chains = [mainnet, sepolia] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// 4. Setup query client
const queryClient = new QueryClient();

// 5. Create the Web3Modal instance and style it to match the Vault theme
if (typeof window !== 'undefined') {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#fbbf24', // Crypto-gold
      '--w3m-color-mix': '#18181b', // Tint the modal with our charcoal surface color
      '--w3m-color-mix-strength': 40, // 40% tint strength (adjust 0-100 to your liking)
      '--w3m-border-radius-master': '2px', // Sharper, hardware-like edges
    }
  });
}

export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}