"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress, formatAmount } from "@/lib/utils";
import { 
  Home, 
  Layers, 
  LayoutDashboard, 
  Store, 
  Wallet, 
  LogOut, 
  Loader2, 
  RefreshCw 
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { publicKey, balance, loading, connect, disconnect, refreshBalance } = useWallet();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse Plans", href: "/plans", icon: Layers },
    { name: "Subscriber Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Merchant Terminal", href: "/merchant", icon: Store },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-primary-hover flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-105 transition-all">
              <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-accent-primary transition-colors">
              Cycle<span className="text-accent-primary">Vault</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-bg-surface text-accent-primary border border-border-subtle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet Actions */}
          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle">
                <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
              </div>
            ) : publicKey ? (
              <div className="flex items-center bg-bg-surface border border-border-subtle rounded-xl p-1.5 pl-3.5 space-x-3.5 max-w-xs">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">
                    Balance
                  </span>
                  <span className="text-sm font-mono font-bold text-accent-success">
                    {formatAmount(balance)} <span className="text-xs text-text-secondary">XLM</span>
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-border-subtle hidden sm:block" />
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-semibold text-text-primary">
                      {shortenAddress(publicKey)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    title="Disconnect Wallet"
                    className="p-1.5 rounded-lg text-text-secondary hover:text-accent-danger hover:bg-bg-surface-hover transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await connect();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Tab Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/90 backdrop-blur-md border-t border-border-subtle px-4 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive(item.href)
                  ? "text-accent-primary scale-110"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] mt-1 font-semibold tracking-tight">
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
