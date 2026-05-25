"use client";
import dynamic from 'next/dynamic';

const Web3ModalProvider = dynamic(
  () => import('./Web3Modal').then((m) => m.Web3ModalProvider),
  { ssr: false }
);

export function ClientWeb3Modal({ children }: { children: React.ReactNode }) {
  return <Web3ModalProvider>{children}</Web3ModalProvider>;
}
