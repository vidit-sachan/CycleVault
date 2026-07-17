"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { 
  fetchMerchantPlans, 
  subscribeToPlan, 
  CONTRACTS 
} from "@/lib/stellar";
import { formatAmount, formatCountdown } from "@/lib/utils";
import deployments from "../../../../deployments/testnet.json";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Clock, 
  Compass,
  ArrowUpRight
} from "lucide-react";

export default function PlansPage() {
  const { publicKey, balance, refreshBalance } = useWallet();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customMerchant, setCustomMerchant] = useState("");
  const [currentMerchant, setCurrentMerchant] = useState(deployments.merchant);

  // Prefund Form State
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [prefundAmount, setPrefundAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{ success: boolean; msg: string; hash?: string } | null>(null);

  const loadPlans = async (merchantAddr: string) => {
    setLoading(true);
    try {
      const fetchedPlans = await fetchMerchantPlans(merchantAddr);
      setPlans(fetchedPlans);
    } catch (e) {
      console.error("Failed to load plans", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans(currentMerchant);
  }, [currentMerchant]);

  const handleSearchMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMerchant.trim().length === 56) {
      setCurrentMerchant(customMerchant.trim());
    }
  };

  const handleOpenSubscribe = (plan: any) => {
    setSelectedPlan(plan);
    setPrefundAmount(String(Number(plan.price) * 3)); // suggest 3 cycles of prefund
    setTxResult(null);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !selectedPlan) return;

    const amount = Number(prefundAmount);
    if (isNaN(amount) || amount < Number(selectedPlan.price)) {
      setTxResult({
        success: false,
        msg: `Prefund amount must be at least the plan price of ${formatAmount(selectedPlan.price)} CYC.`,
      });
      return;
    }

    if (amount > balance) {
      setTxResult({
        success: false,
        msg: `Insufficient balance. You have ${formatAmount(balance)} CYC.`,
      });
      return;
    }

    setSubmitting(true);
    setTxResult(null);

    try {
      const txHash = await subscribeToPlan(publicKey, selectedPlan.id, amount);
      setTxResult({
        success: true,
        msg: `Successfully prefunded and subscribed to ${selectedPlan.name}!`,
        hash: txHash,
      });
      refreshBalance();
    } catch (err: any) {
      console.error(err);
      setTxResult({
        success: false,
        msg: err.message || "Transaction signature rejected or execution failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* Header and Merchant Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Browse Subscription Plans</h1>
          <p className="text-text-secondary text-sm">
            Select a plan to subscribe. Prefund a custom amount of CYC to keep it active.
          </p>
        </div>

        <form onSubmit={handleSearchMerchant} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search Merchant Address..."
            value={customMerchant}
            onChange={(e) => setCustomMerchant(e.target.value)}
            className="bg-bg-surface border border-border-subtle text-white rounded-xl px-4 py-2.5 text-xs font-mono w-64 focus:outline-none focus:border-accent-primary"
          />
          <button
            type="submit"
            disabled={customMerchant.length !== 56}
            className="bg-bg-surface border border-border-subtle hover:bg-bg-surface-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            Query
          </button>
        </form>
      </div>

      {/* Showing results for label */}
      <div className="flex items-center space-x-2 text-xs text-text-secondary bg-bg-surface border border-border-subtle px-4 py-2 rounded-xl w-fit font-mono">
        <Compass className="w-3.5 h-3.5 text-accent-primary" />
        <span>Merchant: {currentMerchant === deployments.merchant ? "Demo Merchant" : currentMerchant}</span>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <span className="text-sm text-text-secondary">Querying merchant registry on-chain...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl bg-bg-surface space-y-4">
          <p className="text-text-secondary">No active plans found for this merchant.</p>
          {currentMerchant !== deployments.merchant && (
            <button
              onClick={() => {
                setCurrentMerchant(deployments.merchant);
                setCustomMerchant("");
              }}
              className="text-accent-primary text-xs font-semibold hover:underline"
            >
              Reset to Demo Merchant
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-bg-surface border p-6 rounded-2xl flex flex-col justify-between hover:bg-bg-surface-hover transition-all duration-200 ${
                plan.active ? "border-border-subtle" : "border-accent-danger/30 opacity-70"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Plan #{plan.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      plan.active
                        ? "bg-accent-success/10 text-accent-success border border-accent-success/20"
                        : "bg-accent-danger/10 text-accent-danger border border-accent-danger/20"
                    }`}
                  >
                    {plan.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <div className="flex items-center text-sm text-text-secondary">
                    <DollarSign className="w-4 h-4 mr-1.5 text-text-secondary" />
                    <span className="text-text-primary font-bold">{formatAmount(plan.price)}</span>
                    <span className="ml-1 text-xs">CYC / cycle</span>
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Clock className="w-4 h-4 mr-1.5 text-text-secondary" />
                    <span>Interval:</span>
                    <span className="ml-1 text-text-primary font-medium">
                      {formatCountdown(Number(plan.interval))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {!publicKey ? (
                  <button
                    disabled
                    className="w-full text-center bg-bg-primary border border-border-subtle text-text-secondary py-2.5 rounded-xl text-xs font-bold"
                  >
                    Connect Wallet to Subscribe
                  </button>
                ) : plan.active ? (
                  <button
                    onClick={() => handleOpenSubscribe(plan)}
                    className="w-full text-center bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:scale-[1.02] text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Prefund & Subscribe
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full text-center bg-bg-primary text-accent-danger border border-accent-danger/20 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Plan Inactive
                  </button>
                )
              }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Subscribe to {selectedPlan.name}
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              Create a vault subscription. You must lock at least one cycle fee ({formatAmount(selectedPlan.price)} CYC).
            </p>

            <form onSubmit={handleSubscribeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Plan Details
                </label>
                <div className="bg-bg-primary border border-border-subtle p-3.5 rounded-xl flex justify-between text-xs">
                  <div>
                    <span className="text-text-secondary">Fee:</span>
                    <span className="text-white font-bold ml-1">{formatAmount(selectedPlan.price)} CYC</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Billing Cycle:</span>
                    <span className="text-white font-bold ml-1">{formatCountdown(Number(selectedPlan.interval))}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Prefund Deposit Amount (CYC)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 300"
                  value={prefundAmount}
                  onChange={(e) => setPrefundAmount(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                />
                <span className="text-[10px] text-text-secondary block">
                  Wallet Balance: {formatAmount(balance)} CYC
                </span>
              </div>

              {txResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-normal flex items-start space-x-2 ${
                    txResult.success
                      ? "bg-accent-success/10 border-accent-success/20 text-accent-success"
                      : "bg-accent-danger/10 border-accent-danger/20 text-accent-danger"
                  }`}
                >
                  {txResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{txResult.msg}</p>
                    {txResult.hash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`}
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
                  onClick={() => setSelectedPlan(null)}
                  disabled={submitting}
                  className="flex-1 bg-bg-primary border border-border-subtle hover:bg-bg-surface text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
                      <span>Signing...</span>
                    </>
                  ) : (
                    <span>Prefund & Subscribe</span>
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
