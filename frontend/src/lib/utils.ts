/**
 * Formats a remaining time in seconds to a human-readable countdown string.
 * @param seconds Remaining seconds
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Due Now";
  
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Formats an amount with standard decimal points.
 * @param amount Token amount as bigint or number
 */
export function formatAmount(amount: number | bigint | string): string {
  const num = Number(amount);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a unix timestamp (seconds) into a readable date string.
 */
export function formatDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Shortens a Stellar address for UI display.
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
