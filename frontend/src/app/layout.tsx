import type { Metadata } from "next";
import { Web3ModalProvider } from "@/context/Web3Modal";
import { BalanceProvider } from "@/context/BalanceContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Byte Bets | Cryptographic Arena",
  description: "The high-end arena for provably fair gaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3ModalProvider>
          <BalanceProvider>
            {children}
          </BalanceProvider>
        </Web3ModalProvider>
      </body>
    </html>
  );
}