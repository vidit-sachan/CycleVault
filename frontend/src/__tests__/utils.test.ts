import { describe, it, expect } from "vitest";
import { formatCountdown, formatAmount, shortenAddress } from "../lib/utils";

describe("Frontend Utility Methods", () => {
  describe("formatCountdown", () => {
    it("should handle due now states", () => {
      expect(formatCountdown(0)).toBe("Due Now");
      expect(formatCountdown(-10)).toBe("Due Now");
    });

    it("should format single components correctly", () => {
      expect(formatCountdown(45)).toBe("45s");
      expect(formatCountdown(120)).toBe("2m");
      expect(formatCountdown(3600)).toBe("1h");
      expect(formatCountdown(86400)).toBe("1d");
    });

    it("should combine multiple components", () => {
      expect(formatCountdown(65)).toBe("1m 5s");
      expect(formatCountdown(3665)).toBe("1h 1m 5s");
      expect(formatCountdown(90061)).toBe("1d 1h 1m 1s");
    });
  });

  describe("formatAmount", () => {
    it("should format integers", () => {
      expect(formatAmount(100)).toBe("100");
      expect(formatAmount(1000)).toBe("1,000");
    });

    it("should format decimals up to 2 decimal places", () => {
      expect(formatAmount(123.456)).toBe("123.46");
      expect(formatAmount(0.1)).toBe("0.1");
    });
  });

  describe("shortenAddress", () => {
    it("should return empty if empty", () => {
      expect(shortenAddress("")).toBe("");
    });

    it("should shorten valid addresses", () => {
      const addr = "GDJBG26ITIHHFQBO7IUKEQZVG3QBVGVD72QC2S4QHCFYKW2WV32NWMI2";
      expect(shortenAddress(addr)).toBe("GDJBG2...WMI2");
    });
  });
});
