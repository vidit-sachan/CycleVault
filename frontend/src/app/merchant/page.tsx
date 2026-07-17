"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { 
  createPlan, 
  fetchMerchantPlans, 
  fetchMerchantSubscriptions,
  chargeSubscription,
  CONTRACTS
} from "@/lib/stellar";
import { formatAmount, formatCountdown, shortenAddress } from "@/lib/utils";
import deployments from "../../../../deployments/testnet.json";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Play, 
  History, 
  Compass,
  ArrowUpRight,
  RefreshCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function MerchantPage() {
  const { publicKey } = useWallet();
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Plan Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("100");
  const [interval, setInterval] = useState("60"); // 60s preset default
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formResult, setFormResult] = useState<{ success: boolean; msg: string; hash?: string } | null>(null);

  // Charge execution state
  const [chargingSubId, setChargingSubId] = useState<number | null>(null);
  
  // Live Charge Feed state
  const [chargeFeed, setChargeFeed] = useState<any[]>([]);

  const loadMerchantData = async (silent = false) => {
    if (!publicKey) return;
    if (!silent) setLoading(true);

    try {
      const [fetchedPlans, fetchedSubs] = await Promise.all([
        fetchMerchantPlans(publicKey),
        fetchMerchantSubscriptions(publicKey)
      ]);
      setPlans(fetchedPlans);
      setSubscriptions(fetchedSubs);
    } catch (e) {
      console.error("Failed to load merchant details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadMerchantData();
      const poller = window.setInterval(() => { loadMerchantData(true); }, 5000);
      return () => window.clearInterval(poller);
    }
  }, [publicKey]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    const pr = Number(price);
    const iv = Number(interval);

    if (name.trim().length === 0 || isNaN(pr) || pr <= 0 || isNaN(iv) || iv <= 0) {
      setFormResult({
        success: false,
        msg: "Invalid form values. Please ensure price and intervals are positive numbers.",
      });
      return;
    }

    setFormSubmitting(true);
    setFormResult(null);

    try {
      const txHash = await createPlan(publicKey, name.trim(), pr, iv);
      setFormResult({
        success: true,
        msg: `Successfully created plan "${name}"!`,
        hash: txHash,
      });
      setName("");
      loadMerchantData(true);
    } catch (err: any) {
      setFormResult({
        success: false,
        msg: err.message || "Failed to create plan. Please verify Freighter wallet.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleProcessCharge = async (subId: number) => {
    if (!publicKey) return;
    setChargingSubId(subId);

    try {
      const txHash = await chargeSubscription(publicKey, subId);
      
      // Add to charge processed live feed
      const targetSub = subscriptions.find(s => s.id === subId);
      const newFeedItem = {
        subId,
        subscriber: targetSub?.subscriber || "Unknown",
        amount: targetSub?.plan?.price || 0,
        txHash,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChargeFeed(prev => [newFeedItem, ...prev]);

      alert(`Billing Charge pulled successfully for subscription #${subId}!`);
      loadMerchantData(true);
    } catch (err: any) {
      alert(err.message || "Failed to execute charge. It may not be due or balance is insufficient.");
    } finally {
      setChargingSubId(null);
    }
  };

  const dueSubscriptions = subscriptions.filter(s => s.isDue && s.status === 0);

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Merchant Terminal</h1>
          <p className="text-text-secondary text-sm">
            Configure subscription offerings, list plan subscribers, and process due pulls.
          </p>
        </div>

        {publicKey && (
          <button
            onClick={() => loadMerchantData(true)}
            className="flex items-center space-x-2 bg-bg-surface border border-border-subtle hover:bg-bg-surface-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <RefreshCcw className="w-4 h-4 text-text-secondary" />
            <span>Sync Stats</span>
          </button>
        )}
      </div>

      {!publicKey ? (
        <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl bg-bg-surface space-y-4">
          <h3 className="text-lg font-bold text-white">Wallet Connection Required</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Please connect your Freighter merchant wallet to access terminal controls and view plan analytics.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <span className="text-sm text-text-secondary">Loading merchant terminal details...</span>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left panel: Create plan & events feed */}
          <div className="space-y-8 lg:col-span-1">
            {/* Create Plan Form */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Create Billing Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix Premium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-primary border border-border-subtle text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Fee (XLM)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-bg-primary border border-border-subtle text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Billing Interval
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full bg-bg-primary border border-border-subtle text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-accent-primary"
                  >
                    <option value="60">60 Seconds (Demo Preset)</option>
                    <option value="300">5 Minutes (Demo Preset)</option>
                    <option value="604800">1 Week</option>
                    <option value="2592000">30 Days</option>
                  </select>
                </div>

                {formResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-[11px] leading-normal flex items-start space-x-2 ${
                      formResult.success
                        ? "bg-accent-success/10 border-accent-success/20 text-accent-success"
                        : "bg-accent-danger/10 border-accent-danger/20 text-accent-danger"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{formResult.msg}</p>
                      {formResult.hash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${formResult.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline flex items-center mt-1.5 font-bold"
                        >
                          <span>View on Stellar Expert</span>
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-gradient-to-r from-accent-primary to-accent-primary-hover text-black py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Add Offering</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Charge feed */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-accent-primary" />
                <h3 className="text-md font-bold text-white">Live Charge Feed</h3>
              </div>

              {chargeFeed.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-6 leading-relaxed">
                  Decentralized events feed. Trigger charges to observe live payment transactions.
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {chargeFeed.map((item, index) => (
                    <div key={index} className="p-3 bg-bg-primary/50 border border-border-subtle rounded-xl text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>Sub #{item.subId} Charged</span>
                        <span className="text-accent-success">+{formatAmount(item.amount)} XLM</span>
                      </div>
                      <p className="text-text-secondary">From: {shortenAddress(item.subscriber)}</p>
                      <div className="flex justify-between items-center text-[9px] text-text-secondary pt-1">
                        <span>Time: {item.timestamp}</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-primary hover:underline"
                        >
                          Tx Details
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Offerings and Subscribers list */}
          <div className="lg:col-span-2 space-y-8">
            {/* Due collections banner */}
            <div className="bg-gradient-to-r from-bg-surface to-bg-surface-hover border border-border-subtle p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-accent-warning" />
                  <span>Keeper Collection Helper</span>
                </h4>
                <p className="text-xs text-text-secondary">
                  There are <span className="text-accent-warning font-bold">{dueSubscriptions.length}</span> subscriptions due for payment collection.
                </p>
              </div>
              {dueSubscriptions.length > 0 && (
                <span className="text-[10px] bg-accent-warning/10 text-accent-warning border border-accent-warning/20 px-2.5 py-1 rounded-full font-bold uppercase animate-pulse">
                  Collectable
                </span>
              )}
            </div>

            {/* Registered Offerings List */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Your Registered Plans</h3>
              {plans.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-6">No plans registered yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map(plan => (
                    <div key={plan.id} className="p-4 bg-bg-primary/50 border border-border-subtle rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold">
                          Plan ID: {plan.id}
                        </span>
                        <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                        <p className="text-xs font-mono text-accent-primary font-bold">
                          {formatAmount(plan.price)} XLM <span className="text-text-secondary font-sans font-normal">/ {formatCountdown(Number(plan.interval))}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          plan.active ? "bg-accent-success/10 text-accent-success border border-accent-success/20" : "bg-accent-danger/10 text-accent-danger border border-accent-danger/20"
                        }`}>
                          {plan.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Subscribers & Collect pulls */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Plan Subscribers</h3>
              {subscriptions.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-6">No active subscribers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        <th className="pb-3 pr-2">Sub ID</th>
                        <th className="pb-3 pr-2">Subscriber</th>
                        <th className="pb-3 pr-2">Plan</th>
                        <th className="pb-3 pr-2">Vault Balance</th>
                        <th className="pb-3 pr-2">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-xs text-text-secondary">
                      {subscriptions.map(sub => {
                        const isCancelled = sub.status === 1;
                        const due = sub.isDue && !isCancelled;

                        return (
                          <tr key={sub.id} className="hover:bg-bg-primary/20">
                            <td className="py-3.5 pr-2 text-white font-mono">#{sub.id}</td>
                            <td className="py-3.5 pr-2 font-mono">{shortenAddress(sub.subscriber)}</td>
                            <td className="py-3.5 pr-2 text-white font-medium">
                              {sub.plan ? sub.plan.name : `Plan #${sub.plan_id}`}
                            </td>
                            <td className="py-3.5 pr-2 font-mono font-bold text-white">
                              {formatAmount(sub.balance)} <span className="text-[10px] text-text-secondary font-normal">XLM</span>
                            </td>
                            <td className="py-3.5 pr-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isCancelled 
                                  ? "bg-accent-danger/10 text-accent-danger" 
                                  : due 
                                  ? "bg-accent-warning/10 text-accent-warning animate-pulse" 
                                  : "bg-accent-success/10 text-accent-success"
                              }`}>
                                {isCancelled ? "Cancelled" : due ? "Due" : "Active"}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              {isCancelled ? (
                                <span className="text-[10px] text-accent-danger">Inactive</span>
                              ) : due ? (
                                <button
                                  onClick={() => handleProcessCharge(sub.id)}
                                  disabled={chargingSubId === sub.id}
                                  className="bg-accent-warning text-bg-primary hover:bg-accent-warning/80 disabled:opacity-50 px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center space-x-1 ml-auto transition-all"
                                >
                                  {chargingSubId === sub.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current" />
                                  )}
                                  <span>Collect</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-text-secondary">Not Due</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
