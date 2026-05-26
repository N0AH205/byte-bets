"use client";

import { Web3ModalProvider } from './Web3Modal';

export function ClientWeb3Modal({ children }: { children: React.ReactNode }) {
  return <Web3ModalProvider>{children}</Web3ModalProvider>;
}
