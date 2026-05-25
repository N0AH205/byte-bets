import type { Metadata } from "next";
import { ClientWeb3Modal } from "@/context/ClientWeb3Modal";
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
        <ClientWeb3Modal>
          <BalanceProvider>
            {children}
          </BalanceProvider>
        </ClientWeb3Modal>
      </body>
    </html>
  );
}