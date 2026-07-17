#!/bin/bash
set -e

echo "=== Building smart contracts ==="
stellar contract build

echo "=== Setup Stellar accounts on Testnet ==="
# Check if keys exist, if not generate and fund them via Friendbot
stellar keys address deployer >/dev/null 2>&1 || stellar keys generate deployer --network testnet
stellar keys address merchant >/dev/null 2>&1 || stellar keys generate merchant --network testnet
stellar keys address subscriber >/dev/null 2>&1 || stellar keys generate subscriber --network testnet

DEPLOYER_ADDR=$(stellar keys address deployer)
MERCHANT_ADDR=$(stellar keys address merchant)
SUBSCRIBER_ADDR=$(stellar keys address subscriber)

echo "Funding accounts via Friendbot..."
curl -s -X POST "https://friendbot.stellar.org/?addr=$DEPLOYER_ADDR" >/dev/null || true
curl -s -X POST "https://friendbot.stellar.org/?addr=$MERCHANT_ADDR" >/dev/null || true
curl -s -X POST "https://friendbot.stellar.org/?addr=$SUBSCRIBER_ADDR" >/dev/null || true
echo "Sleeping 5 seconds to wait for ledger confirmation..."
sleep 5

echo "Deployer:   $DEPLOYER_ADDR"
echo "Merchant:   $MERCHANT_ADDR"
echo "Subscriber: $SUBSCRIBER_ADDR"

echo "=== Deploying smart contracts to Testnet ==="
REGISTRY_WASM="target/wasm32v1-none/release/merchant_registry.wasm"
VAULT_WASM="target/wasm32v1-none/release/cycle_vault.wasm"
TOKEN_WASM="target/wasm32v1-none/release/cyc_token.wasm"

echo "Deploying Merchant Registry..."
REGISTRY_ID=$(stellar contract deploy --wasm "$REGISTRY_WASM" --source deployer --network testnet)
echo "Merchant Registry ID: $REGISTRY_ID"

echo "Deploying Cycle Vault..."
VAULT_ID=$(stellar contract deploy --wasm "$VAULT_WASM" --source deployer --network testnet)
echo "Cycle Vault ID: $VAULT_ID"

echo "Deploying CYC Token..."
TOKEN_ID=$(stellar contract deploy --wasm "$TOKEN_WASM" --source deployer --network testnet)
echo "CYC Token ID: $TOKEN_ID"

echo "=== Initializing contracts ==="
echo "Initializing Merchant Registry..."
stellar contract invoke --id "$REGISTRY_ID" --source deployer --network testnet -- initialize --admin "$DEPLOYER_ADDR"

echo "Initializing Cycle Vault..."
stellar contract invoke --id "$VAULT_ID" --source deployer --network testnet -- initialize --admin "$DEPLOYER_ADDR" --registry "$REGISTRY_ID"

echo "Initializing CYC Token..."
stellar contract invoke --id "$TOKEN_ID" --source deployer --network testnet -- initialize --admin "$DEPLOYER_ADDR" --name "Cycle Token" --symbol "CYC"

echo "=== Minting starting balances ==="
echo "Minting 10,000 CYC to Subscriber..."
stellar contract invoke --id "$TOKEN_ID" --source deployer --network testnet -- mint --to "$SUBSCRIBER_ADDR" --amount 10000

echo "Minting 1,000 CYC to Merchant..."
stellar contract invoke --id "$TOKEN_ID" --source deployer --network testnet -- mint --to "$MERCHANT_ADDR" --amount 1000

echo "=== Creating a Demo Plan (Netflix, 100 CYC, 60s billing cycle) ==="
PLAN_ID=$(stellar contract invoke --id "$REGISTRY_ID" --source merchant --network testnet -- create_plan --merchant "$MERCHANT_ADDR" --name "Netflix" --token "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" --price 100 --interval 60 | tr -d '"')

if [ -z "$PLAN_ID" ]; then
  PLAN_ID=1
fi

echo "Created Plan ID: $PLAN_ID"

echo "=== Creating deployments directory and JSON ==="
mkdir -p deployments
cat <<EOF > deployments/testnet.json
{
  "deployer": "$DEPLOYER_ADDR",
  "merchant": "$MERCHANT_ADDR",
  "subscriber": "$SUBSCRIBER_ADDR",
  "token_id": "$TOKEN_ID",
  "registry_id": "$REGISTRY_ID",
  "vault_id": "$VAULT_ID",
  "plan_id": $PLAN_ID
}
EOF

echo "=== Deployment successful! Deployments saved to deployments/testnet.json ==="
cat deployments/testnet.json
