import React from "react";
import deployments from "../../../deployments/testnet.json";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface py-8 mt-16 mb-20 md:mb-0">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-text-secondary space-y-4 md:space-y-0">
        <div className="flex flex-col items-center md:items-start space-y-1">
          <span className="font-semibold text-text-primary text-sm">
            CycleVault Protocol
          </span>
          <span>© {new Date().getFullYear()} CycleVault. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-center">
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${deployments.registry_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-primary transition-colors"
          >
            Registry Contract
          </a>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${deployments.vault_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-primary transition-colors"
          >
            Cycle Vault Contract
          </a>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-primary transition-colors"
          >
            XLM Asset Contract
          </a>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-success animate-pulse" />
          <span className="font-mono text-text-primary uppercase tracking-wider font-semibold">
            Stellar Testnet
          </span>
        </div>
      </div>
    </footer>
  );
}
