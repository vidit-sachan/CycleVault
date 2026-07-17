import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CycleVault - Decentralized Recurring Payments on Stellar",
  description:
    "Pre-fund smart contract vaults and automate recurring subscriptions, billing cycles, and auto-payments on Stellar Testnet using Soroban.",
  openGraph: {
    title: "CycleVault - Recurring Payments on Stellar",
    description: "Automate subscriptions and recurring payments on Stellar.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-bg-primary text-text-primary min-h-screen flex flex-col antialiased selection:bg-accent-primary selection:text-white`}>
        <WalletProvider>
          {/* Decorative Radial Background Glows */}
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow" />
          </div>

          <Header />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
