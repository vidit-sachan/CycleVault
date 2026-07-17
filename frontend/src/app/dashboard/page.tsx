"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/context/WalletContext";
import { 
  fetchUserSubscriptions, 
  topUpSubscription, 
  cancelSubscription 
} from "@/lib/stellar";
import { formatAmount, formatCountdown, formatDate, shortenAddress } from "@/lib/utils";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  CalendarRange, 
  Clock, 
  Plus, 
  Trash2, 
  ArrowUpRight,
  RefreshCcw,
  Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const { publicKey, balance, refreshBalance } = useWallet();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Top Up Modal State
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; msg: string; hash?: string } | null>(null);

  const loadData = async (silent = false) => {
    if (!publicKey) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchUserSubscriptions(publicKey);
      // Filter out deleted/empty data if any
      setSubscriptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadData();
      // SWR-style polling: re-fetch from chain every 5s to resync countdowns
      const poller = setInterval(() => { loadData(true); }, 5000);
      return () => clearInterval(poller);
    }
  }, [publicKey]);

  // Client-side ticking countdown (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setSubscriptions((prev) =>
        prev.map((sub) => {
          if (sub.status === 1) return sub; // Cancelled
          if (sub.nextChargeIn > 0) {
            const nextVal = sub.nextChargeIn - 1;
            return {
              ...sub,
              nextChargeIn: nextVal,
              isDue: nextVal <= 0,
            };
          }
          return sub;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenTopUp = (sub: any) => {
    setActiveSub(sub);
    setTopUpAmount("300"); // default suggestion
    setActionResult(null);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !activeSub) return;

    const amount = Number(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionResult({
        success: false,
        msg: "Please enter a valid positive amount to deposit.",
      });
      return;
    }

    if (amount > balance) {
      setActionResult({
        success: false,
        msg: `Insufficient balance. You have ${formatAmount(balance)} XLM.`,
      });
      return;
    }

    setActionSubmitting(true);
    setActionResult(null);

    try {
      const txHash = await topUpSubscription(publicKey, activeSub.id, amount);
      setActionResult({
        success: true,
        msg: "Vault prefund deposited successfully!",
        hash: txHash,
      });
      refreshBalance();
      // Reload sub data silently
      loadData(true);
    } catch (err: any) {
      setActionResult({
        success: false,
        msg: err.message || "Top up failed. Please check Freighter wallet.",
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancelSub = async (sub: any) => {
    if (!publicKey) return;
    if (!window.confirm("Are you sure you want to cancel this subscription? Any remaining balance in this vault will be immediately refunded to your wallet.")) {
      return;
    }

    setLoading(true);
    try {
      await cancelSubscription(publicKey, sub.id);
      alert("Subscription cancelled successfully! Prefunded balance refunded.");
      refreshBalance();
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel subscription.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Your Subscriptions</h1>
          <p className="text-text-secondary text-sm">
            Manage your cycle vault prefunded deposits, monitor billing countdowns, and cancel.
          </p>
        </div>

        {publicKey && (
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-bg-surface border border-border-subtle hover:bg-bg-surface-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
            ) : (
              <RefreshCcw className="w-4 h-4 text-text-secondary" />
            )}
            <span>Refresh State</span>
          </button>
        )}
      </div>

      {!publicKey ? (
        <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl bg-bg-surface space-y-4">
          <h3 className="text-lg font-bold text-white">Wallet Connection Required</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Please connect your Freighter wallet to view and manage your active prefunded subscription vaults.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <span className="text-sm text-text-secondary">Loading subscriptions from ledger...</span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl bg-bg-surface space-y-4">
          <p className="text-text-secondary">You do not have any active subscriptions yet.</p>
          <a
            href="/plans"
            className="inline-block bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Browse & Subscribe
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subscriptions Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {subscriptions.map((sub) => {
              const isCancelled = sub.status === 1;
              const due = sub.isDue && !isCancelled;

              return (
                <div
                  key={sub.id}
                  className={`bg-bg-surface border p-6 rounded-3xl flex flex-col justify-between hover:bg-bg-surface-hover transition-all duration-200 ${
                    isCancelled
                      ? "border-border-subtle/50 opacity-60"
                      : due
                      ? "border-accent-warning ring-2 ring-accent-warning/20"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-accent-primary tracking-wider uppercase bg-accent-primary/10 px-2.5 py-0.5 rounded-md border border-accent-primary/20">
                          Subscription #{sub.id}
                        </span>
                        <h3 className="text-xl font-bold text-white pt-1">
                          {sub.plan ? sub.plan.name : `Plan #${sub.plan_id}`}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isCancelled
                            ? "bg-accent-danger/10 text-accent-danger border border-accent-danger/20"
                            : due
                            ? "bg-accent-warning/10 text-accent-warning border border-accent-warning/20 animate-pulse"
                            : "bg-accent-success/10 text-accent-success border border-accent-success/20"
                        }`}
                      >
                        {isCancelled ? "Cancelled" : due ? "Pending Pull" : "Active"}
                      </span>
                    </div>

                    {/* Data Panel */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-bg-primary/50 border border-border-subtle rounded-2xl text-xs">
                      <div className="space-y-1">
                        <span className="text-text-secondary font-medium">Vault Balance:</span>
                        <p className="text-sm font-bold text-white font-mono">
                          {formatAmount(sub.balance)} <span className="text-[10px] text-text-secondary">XLM</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-text-secondary font-medium">Cycle Charge:</span>
                        <p className="text-sm font-bold text-white font-mono">
                          {sub.plan ? formatAmount(sub.plan.price) : "0"} <span className="text-[10px] text-text-secondary">XLM</span>
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2 pt-2 border-t border-border-subtle">
                        <span className="text-text-secondary font-medium">Next Billing Pull:</span>
                        {isCancelled ? (
                          <p className="text-sm font-bold text-accent-danger">Inactive</p>
                        ) : due ? (
                          <p className="text-sm font-bold text-accent-warning flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Due for collection</span>
                          </p>
                        ) : (
                          <p className="text-sm font-bold text-accent-success flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-accent-success shrink-0" />
                            <span>{formatCountdown(sub.nextChargeIn)}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata dates */}
                    <div className="text-[10px] text-text-secondary space-y-1">
                      <p>Merchant: <span className="font-mono">{sub.plan ? shortenAddress(sub.plan.merchant) : "Unknown"}</span></p>
                      <p>Last Charged: <span className="font-mono">{formatDate(sub.last_charge)}</span></p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {!isCancelled && (
                    <div className="flex space-x-3 pt-6 border-t border-border-subtle mt-6">
                      <button
                        onClick={() => handleCancelSub(sub)}
                        className="flex-1 bg-bg-primary border border-border-subtle hover:bg-accent-danger/10 hover:border-accent-danger/25 text-text-secondary hover:text-accent-danger py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Refund</span>
                      </button>
                      <button
                        onClick={() => handleOpenTopUp(sub)}
                        className="flex-1 bg-bg-surface border border-border-subtle hover:border-accent-primary hover:bg-bg-surface-hover text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Top Up Vault</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {activeSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Top Up Subscription Vault
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              Deposit more XLM into Vault Subscription #{activeSub.id} to prefund future billing pulls.
            </p>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Deposit Amount (XLM)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                />
                <span className="text-[10px] text-text-secondary block">
                  Wallet Balance: {formatAmount(balance)} XLM
                </span>
              </div>

              {actionResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-normal flex items-start space-x-2 ${
                    actionResult.success
                      ? "bg-accent-success/10 border-accent-success/20 text-accent-success"
                      : "bg-accent-danger/10 border-accent-danger/20 text-accent-danger"
                  }`}
                >
                  {actionResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{actionResult.msg}</p>
                    {actionResult.hash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${actionResult.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline flex items-center mt-1.5 font-semibold text-[10px]"
                      >
                        <span>View Transaction on Stellar Expert</span>
                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveSub(null)}
                  disabled={actionSubmitting}
                  className="flex-1 bg-bg-primary border border-border-subtle hover:bg-bg-surface text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="flex-1 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {actionSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
                      <span>Depositing...</span>
                    </>
                  ) : (
                    <span>Prefund Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
