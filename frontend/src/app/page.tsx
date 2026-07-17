"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  UserCheck, 
  Zap, 
  CheckCircle 
} from "lucide-react";

export default function Home() {
  const { publicKey, connect } = useWallet();

  const stats = [
    { label: "Active Subscriptions", value: "320+" },
    { label: "Total Prefunded TVL", value: "452.9K XLM" },
    { label: "Cycle Charges Processed", value: "8,412" },
    { label: "Merchant Plans Registered", value: "48" },
  ];

  const steps = [
    {
      title: "1. Create Plans",
      desc: "Merchants register names, prices, and intervals (weekly, monthly, or demo 60s) on-chain.",
      icon: Calendar,
    },
    {
      title: "2. Prefund & Subscribe",
      desc: "Subscribers prefund a dedicated cycle vault with XLM tokens to authorize recurring pulls.",
      icon: UserCheck,
    },
    {
      title: "3. Permissionless Charge",
      desc: "Once a cycle elapses, anyone can trigger charge() to transfer the plan fee to the merchant.",
      icon: Zap,
    },
    {
      title: "4. Cancel & Refund",
      desc: "Subscribers retain full ownership and can cancel at any time to refund the vault balance instantly.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Automate Recurring Payments & Subscriptions on{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-primary-hover">
            Stellar Soroban
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
          CycleVault enables trustless, prefunded recurring pull-payments. No cron jobs, no centralized keepers. Secure subscriptions with instant cancels and full subscriber control.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {publicKey ? (
            <>
              <Link
                href="/plans"
                className="flex items-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Browse Active Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="bg-bg-surface border border-border-subtle hover:bg-bg-surface-hover hover:border-text-secondary px-6 py-3.5 rounded-xl font-semibold transition-all"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <button
              onClick={connect}
              className="flex items-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Connect Freighter Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* Protocol Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-bg-surface border border-border-subtle p-6 rounded-2xl">
        {stats.map((stat, i) => (
          <div key={i} className="text-center space-y-1">
            <p className="text-2xl sm:text-4xl font-extrabold text-white">
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-text-secondary font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* How it Works / Core Mechanics */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Trustless Subscription Architecture
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            No native scheduler? No problem. Here is how CycleVault handles automated billing on-chain.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-primary hover:bg-bg-surface-hover transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                  <Icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlight Callout */}
      <section className="bg-gradient-to-tr from-bg-surface to-bg-surface-hover border border-border-subtle p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <span className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Architecture Highlights
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Auto-Pay without Cron Jobs
          </h3>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Soroban smart contracts do not execute themselves. In CycleVault, anyone (such as a keeper bot or the merchant) can call the <code>charge()</code> endpoint once the cycle interval has elapsed. The contract verifies that the charge is valid and due, making recurring pulls completely decentralized and secure.
          </p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-accent-success" />
              <span>Subscriber retains vault refund authority</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-accent-success" />
              <span>Immutable cycle interval enforcement</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-accent-success" />
              <span>Live pricing checks on merchant registry</span>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-auto flex flex-col items-center justify-center p-6 border border-border-subtle bg-bg-primary rounded-2xl max-w-xs space-y-4">
          <div className="text-center">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
              Demo Token Faucet
            </span>
            <span className="text-xl font-bold text-white">XLM Native Asset</span>
          </div>
          <p className="text-xs text-text-secondary text-center leading-normal">
            Use the pre-configured Stellar Asset Contract (SAC) to test subscribers and merchants using Freighter. XLM is funded by default.
          </p>
          <Link
            href="/plans"
            className="w-full text-center bg-bg-surface border border-border-subtle hover:bg-bg-surface-hover py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Start Testing
          </Link>
        </div>
      </section>
    </div>
  );
}
