import {
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction,
  isConnected,
} from "@stellar/freighter-api";
import {
  rpc,
  TransactionBuilder,
  Networks,
  Address,
  xdr,
  Contract,
  scValToNative,
  nativeToScVal,
  Keypair,
  Account,
} from "@stellar/stellar-sdk";
import deployments from "../../../deployments/testnet.json";

const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

export const CONTRACTS = {
  registry: deployments.registry_id,
  vault: deployments.vault_id,
  token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
};

// Check if dev mode is enabled
export function isDevMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("dev_mode_enabled") === "true";
}

export async function getDevKeypair(): Promise<Keypair> {
  const stored = localStorage.getItem("dev_keypair_secret");
  if (stored) {
    return Keypair.fromSecret(stored);
  }
  const kp = Keypair.random();
  localStorage.setItem("dev_keypair_secret", kp.secret());
  
  // Fund it via Friendbot
  try {
    await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
    // Wait a couple seconds for Friendbot ledger submission
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } catch (e) {
    console.error("Friendbot funding failed", e);
  }
  return kp;
}

/**
 * Checks if wallet is installed and connected.
 */
export async function isWalletConnected(): Promise<boolean> {
  if (isDevMode()) {
    const stored = localStorage.getItem("dev_keypair_secret");
    return !!stored;
  }
  try {
    const connResult = await isConnected();
    if (!connResult?.isConnected) return false;
    const allowed = await isAllowed();
    if (!allowed || !allowed.isAllowed) return false;
    const info = await getAddress();
    return !!info.address;
  } catch {
    return false;
  }
}

/**
 * Connects the Freighter wallet directly.
 */
export async function connectWallet(): Promise<string> {
  try {
    // Request access — this triggers the Freighter popup
    const allowed = await isAllowed();
    if (!allowed || !allowed.isAllowed) {
      const success = await setAllowed();
      if (!success || !success.isAllowed) throw new Error("Wallet connection rejected by user");
    }
    const info = await getAddress();
    if (info.error) throw new Error(info.error);
    if (!info.address) throw new Error("No address returned from Freighter");
    return info.address;
  } catch (err: any) {
    console.error("Freighter connection error:", err);
    throw new Error(err?.message || "Failed to connect Freighter wallet. Make sure the extension is installed.");
  }
}

/**
 * Retrieves the currently connected wallet address.
 */
export async function getConnectedWallet(): Promise<string | null> {
  if (isDevMode()) {
    const stored = localStorage.getItem("dev_keypair_secret");
    if (!stored) return null;
    return Keypair.fromSecret(stored).publicKey();
  }
  try {
    const connResult = await isConnected();
    if (!connResult?.isConnected) return null;
    const info = await getAddress();
    return info.address || null;
  } catch {
    return null;
  }
}

/**
 * Helper to submit a signed transaction and poll its status.
 */
async function sendTx(txXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  if (String(response.status) === "ERROR") {
    const errMsg = (response as any).errorResult?.toString() || (response as any).errorResultXdr || "Transaction failed";
    throw new Error(errMsg);
  }

  let status: string = String(response.status);
  let txResponse: any = response;
  let retries = 0;

  while ((status === "PENDING" || status === "NOT_FOUND") && retries < 15) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const latest = await server.getTransaction(response.hash);
      status = String(latest.status);
      txResponse = latest;
    } catch (e) {
      console.error("Polling error, retrying...", e);
    }
    retries++;
  }

  if (status === "SUCCESS") {
    return response.hash;
  } else {
    const detail = txResponse?.resultXdr?.toString() || txResponse?.errorResultXdr || "";
    throw new Error(`Transaction execution failed. Status: ${status}. ${detail ? "Detail: " + detail : ""}`);
  }
}

/**
 * Build, simulate, sign and send a Soroban contract call.
 */
async function callContract(
  contractId: string,
  methodName: string,
  args: any[],
  sourceAddress: string
): Promise<string> {
  // Load source account details for sequence number
  const account = await server.getAccount(sourceAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(60)
    .build();

  // Simulate to populate fee and resources
  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(simulated)) {
    const assembledTxBuilder = rpc.assembleTransaction(tx, simulated);
    const assembledTx = assembledTxBuilder.build();
    
    if (isDevMode()) {
      const kp = await getDevKeypair();
      assembledTx.sign(kp);
      return await sendTx(assembledTx.toXDR());
    }
    
    const signResult = await signTransaction(assembledTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: sourceAddress,
    });
    if (signResult.error) {
      throw new Error(signResult.error);
    }
    return await sendTx(signResult.signedTxXdr);
  } else {
    throw new Error(
      simulated.error || "Transaction simulation failed. Check parameters."
    );
  }
}

/**
 * Reads a read-only contract function.
 */
async function readContract(
  contractId: string,
  methodName: string,
  args: any[]
): Promise<any> {
  const contract = new Contract(contractId);
  // Create a dummy builder to simulate the read-only call
  const tx = new TransactionBuilder(
    new Account("GDJBG26ITIHHFQBO7IUKEQZVG3QBVGVD72QC2S4QHCFYKW2WV32NWMI2", "0"), // dummy
    { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
  )
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simulated)) {
    // v16 SDK: result is on simulated.result.retval
    if (simulated.result?.retval) {
      return scValToNative(simulated.result.retval);
    }
    // Fallback: legacy results array (older SDK versions)
    if ((simulated as any).results?.[0]?.retval) {
      return scValToNative((simulated as any).results[0].retval);
    }
  }

  if (rpc.Api.isSimulationError(simulated)) {
    console.error(`readContract simulation error for ${methodName} on ${contractId}:`, simulated.error);
  }
  return null;
}

/**
 * Fetches the real XLM balance for a user via Horizon API.
 */
export async function fetchCycBalance(address: string): Promise<number> {
  try {
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!res.ok) {
      console.error("Horizon account fetch failed:", res.status);
      return 0;
    }
    const data = await res.json();
    const nativeBalance = data.balances?.find(
      (b: any) => b.asset_type === "native"
    );
    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch (err) {
    console.error("fetchCycBalance error:", err);
    return 0;
  }
}

function normalizeStatus(status: any): number {
  if (!status) return 0;
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    return status.toLowerCase() === "cancelled" ? 1 : 0;
  }
  if (typeof status === "object") {
    if ("Cancelled" in status || status.name === "Cancelled" || status.value === 1) return 1;
  }
  return 0;
}

/**
 * Fetches a single plan info from the registry.
 */
export async function fetchPlan(planId: number): Promise<any> {
  const res = await readContract(CONTRACTS.registry, "get_plan", [
    nativeToScVal(BigInt(planId), { type: "u64" }),
  ]);
  if (!res) return null;
  return {
    id: Number(res.id),
    merchant: res.merchant.toString(),
    token: res.token.toString(),
    name: res.name.toString(),
    price: Number(res.price),
    interval: Number(res.interval),
    active: !!res.active,
  };
}

/**
 * Lists plan IDs for a merchant.
 */
export async function fetchMerchantPlanIds(merchantAddress: string): Promise<number[]> {
  try {
    const res = await readContract(CONTRACTS.registry, "list_plans_for_merchant", [
      new Address(merchantAddress).toScVal(),
    ]);
    return (res || []).map((id: any) => Number(id));
  } catch (err) {
    console.error("fetchMerchantPlanIds error:", err);
    return [];
  }
}

/**
 * Fetches detailed plan information for a merchant.
 */
export async function fetchMerchantPlans(merchantAddress: string): Promise<any[]> {
  const planIds = await fetchMerchantPlanIds(merchantAddress);
  const plans = [];
  for (const id of planIds) {
    try {
      const plan = await fetchPlan(id);
      plans.push(plan);
    } catch (e) {
      console.error(e);
    }
  }
  return plans;
}

/**
 * Fetches subscription details by ID.
 */
export async function fetchSubscription(subId: number): Promise<any> {
  const res = await readContract(CONTRACTS.vault, "get_subscription", [
    nativeToScVal(BigInt(subId), { type: "u64" }),
  ]);
  if (!res) return null;
  return {
    id: Number(res.id),
    subscriber: res.subscriber.toString(),
    plan_id: Number(res.plan_id),
    balance: Number(res.balance),
    last_charge: Number(res.last_charge),
    created_at: Number(res.created_at),
    status: normalizeStatus(res.status),
  };
}

/**
 * Fetches subscription IDs for a user.
 */
export async function fetchUserSubscriptionIds(userAddress: string): Promise<number[]> {
  try {
    const res = await readContract(CONTRACTS.vault, "list_subscriptions_for", [
      new Address(userAddress).toScVal(),
    ]);
    return (res || []).map((id: any) => Number(id));
  } catch (err) {
    console.error("fetchUserSubscriptionIds error:", err);
    return [];
  }
}

/**
 * Fetches all subscriptions for a user with status & countdown calculations.
 */
export async function fetchUserSubscriptions(userAddress: string): Promise<any[]> {
  const ids = await fetchUserSubscriptionIds(userAddress);
  const subs = [];
  for (const id of ids) {
    try {
      const sub = await fetchSubscription(id);
      const plan = await fetchPlan(sub.plan_id);
      let nextChargeIn = 0;
      let isDue = false;
      try {
        nextChargeIn = Number(
          await readContract(CONTRACTS.vault, "next_charge_in", [
            nativeToScVal(BigInt(id), { type: "u64" }),
          ])
        );
      } catch {}
      try {
        isDue = await readContract(CONTRACTS.vault, "is_due", [
          nativeToScVal(BigInt(id), { type: "u64" }),
        ]);
      } catch {}

      subs.push({
        ...sub,
        plan,
        nextChargeIn,
        isDue,
      });
    } catch (e) {
      console.error(e);
    }
  }
  return subs;
}

/**
 * Fetches subscription IDs for a merchant.
 */
export async function fetchMerchantSubscriptionIds(merchantAddress: string): Promise<number[]> {
  try {
    const res = await readContract(CONTRACTS.vault, "list_subscriptions_for_merchant", [
      new Address(CONTRACTS.registry).toScVal(),
      new Address(merchantAddress).toScVal(),
    ]);
    return (res || []).map((id: any) => Number(id));
  } catch (err) {
    console.error("fetchMerchantSubscriptionIds error:", err);
    return [];
  }
}

/**
 * Fetches all subscriptions details for a merchant.
 */
export async function fetchMerchantSubscriptions(merchantAddress: string): Promise<any[]> {
  const ids = await fetchMerchantSubscriptionIds(merchantAddress);
  const subs = [];
  for (const id of ids) {
    try {
      const sub = await fetchSubscription(id);
      const plan = await fetchPlan(sub.plan_id);
      let isDue = false;
      try {
        isDue = await readContract(CONTRACTS.vault, "is_due", [
          nativeToScVal(BigInt(id), { type: "u64" }),
        ]);
      } catch {}
      subs.push({
        ...sub,
        plan,
        isDue,
      });
    } catch (e) {
      console.error(e);
    }
  }
  return subs;
}

/**
 * Subscribes a user to a plan.
 */
export async function subscribeToPlan(
  subscriber: string,
  planId: number,
  prefundAmount: number
): Promise<string> {
  return await callContract(
    CONTRACTS.vault,
    "subscribe",
    [
      new Address(subscriber).toScVal(),
      nativeToScVal(BigInt(planId), { type: "u64" }),
      nativeToScVal(BigInt(prefundAmount), { type: "i128" }),
    ],
    subscriber
  );
}

/**
 * Tops up a subscription prefunded balance.
 */
export async function topUpSubscription(
  subscriber: string,
  subId: number,
  amount: number
): Promise<string> {
  return await callContract(
    CONTRACTS.vault,
    "top_up",
    [
      new Address(subscriber).toScVal(),
      nativeToScVal(BigInt(subId), { type: "u64" }),
      nativeToScVal(BigInt(amount), { type: "i128" }),
    ],
    subscriber
  );
}

/**
 * Cancels a subscription.
 */
export async function cancelSubscription(
  subscriber: string,
  subId: number
): Promise<string> {
  return await callContract(
    CONTRACTS.vault,
    "cancel",
    [
      new Address(subscriber).toScVal(),
      nativeToScVal(BigInt(subId), { type: "u64" }),
    ],
    subscriber
  );
}

/**
 * Charges a subscription (Permissionless).
 */
export async function chargeSubscription(
  caller: string,
  subId: number
): Promise<string> {
  return await callContract(
    CONTRACTS.vault,
    "charge",
    [
      new Address(caller).toScVal(),
      nativeToScVal(BigInt(subId), { type: "u64" }),
    ],
    caller
  );
}

/**
 * Creates a plan (Merchant only).
 */
export async function createPlan(
  merchant: string,
  name: string,
  price: number,
  interval: number
): Promise<string> {
  return await callContract(
    CONTRACTS.registry,
    "create_plan",
    [
      new Address(merchant).toScVal(),
      nativeToScVal(name, { type: "symbol" }),
      new Address(CONTRACTS.token).toScVal(),
      nativeToScVal(BigInt(price), { type: "i128" }),
      nativeToScVal(BigInt(interval), { type: "u64" }),
    ],
    merchant
  );
}
