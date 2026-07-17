#![cfg(test)]
use super::*;
use soroban_sdk::{
    Env, Address, testutils::{Address as _, Ledger}, String, Symbol, symbol_short, vec
};

// ============================================================
// Helper: sets up all 3 contracts + mints tokens to subscriber
// ============================================================
fn setup_env() -> (
    Env,
    Address, // admin
    Address, // merchant
    Address, // subscriber
    Address, // token_id
    cyc_token::TokenContractClient<'static>,
    merchant_registry::MerchantRegistryContractClient<'static>,
    Address, // vault_id
    CycleVaultContractClient<'static>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let token_id = env.register_contract(None, cyc_token::TokenContract);
    let token_client = cyc_token::TokenContractClient::new(&env, &token_id);
    token_client.initialize(
        &admin,
        &String::from_str(&env, "Cycle Token"),
        &String::from_str(&env, "CYC"),
    );

    let registry_id = env.register_contract(None, merchant_registry::MerchantRegistryContract);
    let registry_client =
        merchant_registry::MerchantRegistryContractClient::new(&env, &registry_id);
    registry_client.initialize(&admin);

    let vault_id = env.register_contract(None, CycleVaultContract);
    let vault_client = CycleVaultContractClient::new(&env, &vault_id);
    vault_client.initialize(&admin, &registry_id);

    token_client.mint(&subscriber, &10_000i128);

    (
        env,
        admin,
        merchant,
        subscriber,
        token_id,
        token_client,
        registry_client,
        vault_id,
        vault_client,
    )
}

// ----- MERCHANT REGISTRY TESTS -----

#[test]
fn test_01_plan_creation_and_get_plan() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let registry_id = env.register_contract(None, merchant_registry::MerchantRegistryContract);
    let client = merchant_registry::MerchantRegistryContractClient::new(&env, &registry_id);
    client.initialize(&admin);

    let name = Symbol::new(&env, "netflix");
    let plan_id = client.create_plan(&merchant, &name, &token_addr, &1000i128, &30u64);
    assert_eq!(plan_id, 1);

    let plan = client.get_plan(&plan_id);
    assert_eq!(plan.id, 1);
    assert_eq!(plan.merchant, merchant);
    assert_eq!(plan.name, name);
    assert_eq!(plan.token, token_addr);
    assert_eq!(plan.price, 1000i128);
    assert_eq!(plan.interval, 30u64);
    assert!(plan.active);
}

#[test]
fn test_02_update_price_requires_merchant_auth() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let registry_id = env.register_contract(None, merchant_registry::MerchantRegistryContract);
    let client = merchant_registry::MerchantRegistryContractClient::new(&env, &registry_id);
    client.initialize(&admin);

    let plan_id = client.create_plan(
        &merchant,
        &Symbol::new(&env, "premium"),
        &token_addr,
        &500i128,
        &60u64,
    );

    client.update_price(&merchant, &plan_id, &750i128);
    let plan = client.get_plan(&plan_id);
    assert_eq!(plan.price, 750i128);
}

#[test]
fn test_03_set_active_toggles_plan_status() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let registry_id = env.register_contract(None, merchant_registry::MerchantRegistryContract);
    let client = merchant_registry::MerchantRegistryContractClient::new(&env, &registry_id);
    client.initialize(&admin);

    let plan_id = client.create_plan(
        &merchant,
        &Symbol::new(&env, "basic"),
        &token_addr,
        &100i128,
        &10u64,
    );

    assert!(client.get_plan(&plan_id).active);
    client.set_active(&merchant, &plan_id, &false);
    assert!(!client.get_plan(&plan_id).active);
    client.set_active(&merchant, &plan_id, &true);
    assert!(client.get_plan(&plan_id).active);
}

#[test]
fn test_04_list_plans_for_merchant() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let other_merchant = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let registry_id = env.register_contract(None, merchant_registry::MerchantRegistryContract);
    let client = merchant_registry::MerchantRegistryContractClient::new(&env, &registry_id);
    client.initialize(&admin);

    let p1 = client.create_plan(&merchant, &Symbol::new(&env, "planA"), &token_addr, &100i128, &60u64);
    let p2 = client.create_plan(&merchant, &Symbol::new(&env, "planB"), &token_addr, &200i128, &120u64);
    let _p3 = client.create_plan(&other_merchant, &Symbol::new(&env, "other"), &token_addr, &300i128, &30u64);

    let plans = client.list_plans_for_merchant(&merchant);
    assert_eq!(plans.len(), 2);
    assert_eq!(plans.get(0).unwrap(), p1);
    assert_eq!(plans.get(1).unwrap(), p2);

    let other_plans = client.list_plans_for_merchant(&other_merchant);
    assert_eq!(other_plans.len(), 1);
}

// ----- CYCLE VAULT: SUBSCRIBE TESTS -----

#[test]
fn test_05_subscribe_pulls_correct_prefund_amount() {
    let (_env, _admin, merchant, subscriber, token_id, token_client, registry_client, vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Gym"),
        &token_id,
        &500i128,
        &60u64,
    );

    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &2000i128);
    assert_eq!(sub_id, 1);
    assert_eq!(token_client.balance(&subscriber), 8000i128);
    assert_eq!(token_client.balance(&vault_id), 2000i128);

    let info = vault_client.get_subscription(&sub_id);
    assert_eq!(info.balance, 2000i128);
    assert_eq!(info.status, SubStatus::Active);
}

#[test]
fn test_06_subscribe_against_inactive_plan_fails() {
    let (_env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Yoga"),
        &token_id,
        &300i128,
        &60u64,
    );
    registry_client.set_active(&merchant, &plan_id, &false);

    let res = vault_client.try_subscribe(&subscriber, &plan_id, &1000i128);
    assert!(res.is_err());
}

#[test]
fn test_07_subscribe_with_insufficient_prefund_fails() {
    let (_env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Expensive"),
        &token_id,
        &5000i128,
        &60u64,
    );

    // Prefund less than one cycle's price
    let res = vault_client.try_subscribe(&subscriber, &plan_id, &100i128);
    assert!(res.is_err());
}

// ----- CYCLE VAULT: CHARGE TESTS -----

#[test]
fn test_08_charge_before_interval_elapses_fails() {
    let (_env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Stream"),
        &token_id,
        &500i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &2000i128);

    // Immediately try to charge — should fail with TooEarly
    let keeper = Address::generate(&_env);
    let res = vault_client.try_charge(&keeper, &sub_id);
    assert!(res.is_err());
}

#[test]
fn test_09_charge_succeeds_after_interval() {
    let (env, _admin, merchant, subscriber, token_id, token_client, registry_client, vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "Music"),
        &token_id,
        &500i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &2000i128);

    // Advance time past interval
    env.ledger().set_timestamp(env.ledger().timestamp() + 61);
    assert!(vault_client.is_due(&sub_id));

    let keeper = Address::generate(&env);
    vault_client.charge(&keeper, &sub_id);

    assert_eq!(token_client.balance(&merchant), 500i128);
    assert_eq!(token_client.balance(&vault_id), 1500i128);
    let info = vault_client.get_subscription(&sub_id);
    assert_eq!(info.balance, 1500i128);
}

#[test]
fn test_10_charge_drains_vault_correctly_across_multiple_cycles() {
    let (env, _admin, merchant, subscriber, token_id, token_client, registry_client, vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "News"),
        &token_id,
        &400i128,
        &30u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1200i128); // exactly 3 cycles

    let keeper = Address::generate(&env);

    // Cycle 1
    env.ledger().set_timestamp(env.ledger().timestamp() + 30);
    vault_client.charge(&keeper, &sub_id);
    assert_eq!(vault_client.get_subscription(&sub_id).balance, 800i128);

    // Cycle 2
    env.ledger().set_timestamp(env.ledger().timestamp() + 30);
    vault_client.charge(&keeper, &sub_id);
    assert_eq!(vault_client.get_subscription(&sub_id).balance, 400i128);

    // Cycle 3
    env.ledger().set_timestamp(env.ledger().timestamp() + 30);
    vault_client.charge(&keeper, &sub_id);
    assert_eq!(vault_client.get_subscription(&sub_id).balance, 0i128);

    assert_eq!(token_client.balance(&merchant), 1200i128);
    assert_eq!(token_client.balance(&vault_id), 0i128);

    // Cycle 4 — insufficient balance
    env.ledger().set_timestamp(env.ledger().timestamp() + 30);
    assert!(vault_client.try_charge(&keeper, &sub_id).is_err());
}

#[test]
fn test_11_charge_on_cancelled_subscription_fails() {
    let (env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "VPN"),
        &token_id,
        &200i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1000i128);
    vault_client.cancel(&subscriber, &sub_id);

    env.ledger().set_timestamp(env.ledger().timestamp() + 61);
    let keeper = Address::generate(&env);
    assert!(vault_client.try_charge(&keeper, &sub_id).is_err());
}

#[test]
fn test_12_charge_on_insufficient_balance_fails() {
    let (env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "Cloud"),
        &token_id,
        &500i128,
        &60u64,
    );
    // Prefund exactly 1 cycle
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &500i128);

    // Drain first cycle
    env.ledger().set_timestamp(env.ledger().timestamp() + 60);
    vault_client.charge(&subscriber, &sub_id);

    // Second cycle — balance is 0
    env.ledger().set_timestamp(env.ledger().timestamp() + 60);
    assert!(!vault_client.is_due(&sub_id));
    assert!(vault_client.try_charge(&subscriber, &sub_id).is_err());
}

#[test]
fn test_13_charge_on_deactivated_plan_fails() {
    let (env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "API"),
        &token_id,
        &300i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &2000i128);

    // Deactivate plan
    registry_client.set_active(&merchant, &plan_id, &false);

    env.ledger().set_timestamp(env.ledger().timestamp() + 61);
    let keeper = Address::generate(&env);
    assert!(vault_client.try_charge(&keeper, &sub_id).is_err());
}

// ----- CYCLE VAULT: CANCEL TESTS -----

#[test]
fn test_14_cancel_refunds_exact_remaining_balance() {
    let (_env, _admin, merchant, subscriber, token_id, token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Fitness"),
        &token_id,
        &300i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1500i128);
    assert_eq!(token_client.balance(&subscriber), 8500i128); // 10000 - 1500

    vault_client.cancel(&subscriber, &sub_id);
    assert_eq!(token_client.balance(&subscriber), 10_000i128); // refunded 1500
    let info = vault_client.get_subscription(&sub_id);
    assert_eq!(info.status, SubStatus::Cancelled);
    assert_eq!(info.balance, 0i128);
}

#[test]
fn test_15_cancel_by_non_subscriber_fails() {
    let (_env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "SaaS"),
        &token_id,
        &200i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1000i128);

    // Non-subscriber tries to cancel — should fail NotSubscriber check
    // Note: mock_all_auths() bypasses require_auth, but the subscriber address check
    // in the contract code still enforces it
    let intruder = Address::generate(&_env);
    let res = vault_client.try_cancel(&intruder, &sub_id);
    assert!(res.is_err());
}

// ----- CYCLE VAULT: TOP-UP TESTS -----

#[test]
fn test_16_top_up_increases_balance_without_resetting_last_charge() {
    let (env, _admin, merchant, subscriber, token_id, token_client, registry_client, vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "Gaming"),
        &token_id,
        &500i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1000i128);
    let info_before = vault_client.get_subscription(&sub_id);
    let last_charge_before = info_before.last_charge;

    // Advance time a bit then top up
    env.ledger().set_timestamp(env.ledger().timestamp() + 20);
    vault_client.top_up(&subscriber, &sub_id, &500i128);

    let info_after = vault_client.get_subscription(&sub_id);
    assert_eq!(info_after.balance, 1500i128);
    assert_eq!(info_after.last_charge, last_charge_before); // NOT reset
    assert_eq!(token_client.balance(&subscriber), 8500i128); // 10000 - 1000 - 500
    assert_eq!(token_client.balance(&vault_id), 1500i128);
}

#[test]
fn test_17_top_up_cancelled_subscription_fails() {
    let (_env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&_env, "Podcast"),
        &token_id,
        &100i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &500i128);
    vault_client.cancel(&subscriber, &sub_id);

    let res = vault_client.try_top_up(&subscriber, &sub_id, &200i128);
    assert!(res.is_err());
}

// ----- CYCLE VAULT: TIMING / QUERY TESTS -----

#[test]
fn test_18_next_charge_in_returns_correct_values() {
    let (env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "Mail"),
        &token_id,
        &200i128,
        &100u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &1000i128);

    // Immediately after subscribe: next_charge_in = interval
    assert_eq!(vault_client.next_charge_in(&sub_id), 100i64);

    // After 40 seconds: 60 seconds left
    env.ledger().set_timestamp(env.ledger().timestamp() + 40);
    assert_eq!(vault_client.next_charge_in(&sub_id), 60i64);

    // After 100 seconds total: 0 (due now)
    env.ledger().set_timestamp(env.ledger().timestamp() + 60);
    assert_eq!(vault_client.next_charge_in(&sub_id), 0i64);
    assert!(vault_client.is_due(&sub_id));

    // After 120 seconds total: -20 (overdue)
    env.ledger().set_timestamp(env.ledger().timestamp() + 20);
    assert_eq!(vault_client.next_charge_in(&sub_id), -20i64);
    assert!(vault_client.is_due(&sub_id));
}

#[test]
fn test_19_price_change_picked_up_on_next_charge() {
    let (env, _admin, merchant, subscriber, token_id, token_client, registry_client, _vault_id, vault_client) = setup_env();

    let plan_id = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "Storage"),
        &token_id,
        &500i128,
        &60u64,
    );
    let sub_id = vault_client.subscribe(&subscriber, &plan_id, &3000i128);

    // Charge at original price
    env.ledger().set_timestamp(env.ledger().timestamp() + 60);
    vault_client.charge(&subscriber, &sub_id);
    assert_eq!(token_client.balance(&merchant), 500i128);

    // Merchant updates price to 800
    registry_client.update_price(&merchant, &plan_id, &800i128);

    // Next charge uses the NEW price
    env.ledger().set_timestamp(env.ledger().timestamp() + 60);
    vault_client.charge(&subscriber, &sub_id);
    assert_eq!(token_client.balance(&merchant), 1300i128); // 500 + 800
    assert_eq!(vault_client.get_subscription(&sub_id).balance, 1700i128); // 3000 - 500 - 800
}

#[test]
fn test_20_list_subscriptions_for_subscriber_and_merchant() {
    let (env, _admin, merchant, subscriber, token_id, _token_client, registry_client, _vault_id, vault_client) = setup_env();

    let p1 = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "PlanA"),
        &token_id,
        &200i128,
        &30u64,
    );
    let p2 = registry_client.create_plan(
        &merchant,
        &Symbol::new(&env, "PlanB"),
        &token_id,
        &300i128,
        &60u64,
    );

    let sub1 = vault_client.subscribe(&subscriber, &p1, &1000i128);
    let sub2 = vault_client.subscribe(&subscriber, &p2, &1500i128);

    // Subscriber list
    let subs = vault_client.list_subscriptions_for(&subscriber);
    assert_eq!(subs.len(), 2);
    assert_eq!(subs.get(0).unwrap(), sub1);
    assert_eq!(subs.get(1).unwrap(), sub2);

    // Merchant list
    let m_subs = vault_client.list_subscriptions_for_merchant(&registry_client.address, &merchant);
    assert_eq!(m_subs.len(), 2);

    // Another subscriber has empty lists
    let other = Address::generate(&env);
    assert_eq!(vault_client.list_subscriptions_for(&other).len(), 0);
}

