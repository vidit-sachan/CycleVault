"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  connectWallet,
  getConnectedWallet,
  isWalletConnected,
  fetchCycBalance,
} from "@/lib/stellar";

interface WalletContextType {
  publicKey: string | null;
  balance: number;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = async () => {
    if (publicKey) {
      try {
        const bal = await fetchCycBalance(publicKey);
        setBalance(bal);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    }
  };

  const connect = async () => {
    setError(null);
    try {
      const pubKey = await connectWallet();
      setPublicKey(pubKey);
      localStorage.setItem("wallet_connected", "true");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      throw err;
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setBalance(0);
    localStorage.removeItem("wallet_connected");
    localStorage.removeItem("dev_mode_enabled");
    localStorage.removeItem("dev_keypair_secret");
  };

  // Check initial connection
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await isWalletConnected();
      const storedConnection = localStorage.getItem("wallet_connected");
      
      if (isConnected && storedConnection === "true") {
        try {
          const pubKey = await getConnectedWallet();
          setPublicKey(pubKey);
        } catch {
          // Ignore
        }
      }
      setLoading(false);
    };

    checkConnection();
  }, []);

  // Fetch balance when public key changes
  useEffect(() => {
    refreshBalance();
    if (publicKey) {
      const interval = setInterval(refreshBalance, 5000); // refresh balance every 5s
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        balance,
        loading,
        error,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
