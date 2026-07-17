"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { 
  ArrowRight, 
  Calendar, 
  UserCheck, 
  Zap, 
  ShieldCheck, 
  Check, 
  Users, 
  Coins, 
  TrendingUp, 
  Award,
  Sparkles,
  Code2
} from "lucide-react";


export default function Home() {
  const { publicKey, connect } = useWallet();

  const stats = [
    { label: "Active Subscriptions", value: "320+", icon: Users },
    { label: "Total Prefunded TVL", value: "452.9K XLM", icon: Coins },
    { label: "Cycle Charges Processed", value: "8,412", icon: Zap },
    { label: "Merchant Plans Registered", value: "48", icon: TrendingUp },
  ];

  const designCards = [
    {
      title: "Create Plans",
      desc: "Set prices, intervals, and rules in minutes.",
      icon: Calendar,
    },
    {
      title: "Prefund & Subscribe",
      desc: "Lock funds, approve once, and forget.",
      icon: UserCheck,
    },
    {
      title: "Automated Charges",
      desc: "Smart contracts handle payments on-chain.",
      icon: Zap,
    },
    {
      title: "Cancel Anytime",
      desc: "Full control. Instant refunds.",
      icon: ShieldCheck,
    },
  ];

  const steps = [
    {
      stepNum: "1",
      title: "Create Plan",
      desc: "Merchants set plan details and rules.",
      icon: Calendar,
    },
    {
      stepNum: "2",
      title: "Subscribe",
      desc: "Subscribers prefund and authorize.",
      icon: UserCheck,
    },
    {
      stepNum: "3",
      title: "Auto Charge",
      desc: "Smart contract executes on time.",
      icon: Zap,
    },
    {
      stepNum: "4",
      title: "Cancel / Refund",
      desc: "Control stays with the subscriber.",
      icon: ShieldCheck,
    },
  ];

  const benefits = [
    {
      title: "Fully Decentralized",
      desc: "No single point of failure.",
      icon: Users,
    },
    {
      title: "Instant & Efficient",
      desc: "Built for speed with Stellar.",
      icon: Zap,
    },
    {
      title: "Secure & Auditable",
      desc: "Transparent and verifiable.",
      icon: ShieldCheck,
    },
    {
      title: "Developer Friendly",
      desc: "Easy to integrate and extend.",
      icon: Code2,
    },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* 1. HERO SECTION */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
        <div className="space-y-6 lg:max-w-xl text-left">
          <div className="inline-flex items-center space-x-2 bg-accent-primary/10 border border-accent-primary/20 px-3 py-1 rounded-full text-[10px] font-bold text-accent-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
            <span>Built on Stellar Soroban</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Automate Recurring <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-primary-hover">
              Payments & Subscriptions
            </span>
          </h1>

          <p className="text-sm font-semibold tracking-wider text-accent-primary/80 uppercase">
            Secure • Trustless • Decentralized
          </p>

          <p className="text-base text-text-secondary leading-relaxed">
            CycleVault lets merchants and subscribers automate recurring payments — with full control, zero middlemen.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/plans"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-bg-primary px-6 py-3.5 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Browse Active Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center bg-bg-surface border border-accent-primary/30 hover:border-accent-primary hover:bg-bg-surface-hover text-white px-6 py-3.5 rounded-xl font-bold transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* 3D Gold Coins Illustration */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
          <div className="absolute inset-0 radial-glow z-0" />
          <div className="relative z-10 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] hover:scale-105 transition-transform duration-500">
            <Image
              src="/recurring_payments.png"
              alt="Recurring Payments"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* 2. STATS GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-bg-surface border border-border-subtle p-6 rounded-2xl max-w-6xl mx-auto shadow-lg shadow-accent-primary/2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex flex-col items-center justify-center text-center p-4 rounded-xl hover:bg-bg-primary/20 transition-all space-y-2">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                <Icon className="w-5 h-5 text-accent-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-text-secondary font-medium tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      {/* 3. TRUSTLESS BY DESIGN */}
      <section className="space-y-10 max-w-6xl mx-auto text-center">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Trustless by Design
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm max-w-xl mx-auto">
            Everything you need for seamless recurring payments on-chain.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {designCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-primary/50 hover:bg-bg-surface-hover transition-all text-left space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                  <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="text-base font-bold text-white">{card.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. WHY CYCLEVAULT BANNER */}
      <section className="bg-bg-surface border border-border-subtle p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto relative overflow-hidden">
        <div className="space-y-6 max-w-xl text-left z-10">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Why CycleVault?
          </h3>
          <ul className="space-y-3.5 text-sm text-text-secondary">
            <li className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-accent-primary/10 flex items-center justify-center border border-accent-primary/30">
                <Check className="w-3 h-3 text-accent-primary" />
              </div>
              <span className="font-semibold text-white">No cron jobs. No centralized keepers.</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-accent-primary/10 flex items-center justify-center border border-accent-primary/30">
                <Check className="w-3 h-3 text-accent-primary" />
              </div>
              <span className="font-semibold text-white">Built on Stellar Soroban for speed & security.</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-accent-primary/10 flex items-center justify-center border border-accent-primary/30">
                <Check className="w-3 h-3 text-accent-primary" />
              </div>
              <span className="font-semibold text-white">Open, transparent, and fully on-chain.</span>
            </li>
          </ul>

          <div className="flex items-center space-x-6 pt-4 border-t border-border-subtle text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
            <div className="flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-accent-primary" />
              <span>Secured by Stellar</span>
            </div>
            <span>Decentralized</span>
            <span>Transparent</span>
            <span>Permissionless</span>
          </div>
        </div>

        {/* 3D Shield Illustration */}
        <div className="relative w-[180px] h-[180px] flex shrink-0 justify-center items-center z-10 hover:scale-105 transition-transform duration-500">
          <Image
            src="/security_trust.png"
            alt="Security and Trust"
            fill
            className="object-contain"
          />
        </div>
      </section>

      {/* 5. HOW CYCLEVAULT WORKS */}
      <section className="space-y-12 max-w-6xl mx-auto text-center">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How CycleVault Works
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm">
            Simple flow. Powerful infrastructure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="bg-bg-surface border border-border-subtle p-6 rounded-2xl relative space-y-4 text-left">
                <div className="absolute top-4 right-4 text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20 w-6 h-6 rounded-full flex items-center justify-center">
                  {step.stepNum}
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                  <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BUILT FOR TRUSTLESS AUTOMATION */}
      <section className="bg-bg-surface border border-border-subtle rounded-3xl p-8 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-left">
          <span className="text-[10px] text-accent-primary font-bold uppercase tracking-wider bg-accent-primary/10 border border-accent-primary/20 px-3 py-1 rounded-full">
            Architecture
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            Built for Trustless Automation
          </h3>
          <ul className="space-y-3">
            {[
              "XLM native payments",
              "Immutable & verifiable",
              "No intermediaries"
            ].map((item, i) => (
              <li key={i} className="flex items-center space-x-3 text-sm text-text-secondary">
                <div className="w-4 h-4 rounded-full bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-accent-primary" />
                </div>
                <span className="font-semibold text-white">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contract Diagram Platform illustration */}
        <div className="relative flex justify-center md:justify-end items-center">
          <div className="absolute inset-0 radial-glow z-0" />
          
          <div className="relative z-10 flex flex-row items-center gap-4">
            <div className="flex flex-col gap-6">
              <div className="bg-bg-primary border border-border-subtle p-3 rounded-xl text-center min-w-[100px] shadow-lg">
                <span className="text-[10px] text-text-secondary block">Role</span>
                <span className="text-xs font-bold text-white">Merchant</span>
              </div>
              <div className="bg-bg-primary border border-border-subtle p-3 rounded-xl text-center min-w-[100px] shadow-lg">
                <span className="text-[10px] text-text-secondary block">Role</span>
                <span className="text-xs font-bold text-white">Subscriber</span>
              </div>
            </div>
            
            <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] hover:rotate-3 transition-transform duration-500">
              <Image
                src="/smart_contract_automation.png"
                alt="Smart Contract Automation"
                fill
                className="object-contain"
              />
            </div>

            <div className="bg-bg-primary border border-accent-primary/30 p-3 rounded-xl text-center shadow-lg relative -left-4">
              <span className="text-[9px] text-accent-primary block uppercase font-bold tracking-wider">Logic</span>
              <span className="text-xs font-bold text-white">Smart Contract</span>
              <span className="text-[8px] text-text-secondary block font-mono">Soroban</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. KEY BENEFITS */}
      <section className="space-y-10 max-w-6xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Key Benefits
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div key={i} className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-primary/50 transition-all text-left space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                  <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h4 className="text-sm font-bold text-white">{benefit.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="bg-gradient-to-r from-bg-surface via-bg-surface-hover to-bg-surface border border-border-subtle p-8 sm:p-12 rounded-3xl max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute inset-0 radial-glow z-0" />
        <div className="space-y-3 text-left max-w-xl z-10">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to streamline your <br />recurring payments?
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary">
            Join merchants and subscribers already building on CycleVault.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10 shrink-0 w-full md:w-auto">
          <Link
            href="/plans"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-bg-primary px-6 py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-all"
          >
            <span>Browse Active Plans</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center bg-bg-primary border border-accent-primary/30 hover:border-accent-primary text-white px-6 py-3.5 rounded-xl font-bold transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
