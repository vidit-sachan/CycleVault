#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlanInfo {
    pub id: u64,
    pub merchant: Address,
    pub name: Symbol,
    pub token: Address,
    pub price: i128,
    pub interval: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextPlanId,
    Plan,
    MerchantPlans,
}

#[contract]
pub struct MerchantRegistryContract;

#[contractimpl]
impl MerchantRegistryContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextPlanId, &1u64); // starts at 1
    }

    pub fn create_plan(
        env: Env,
        merchant: Address,
        name: Symbol,
        token: Address,
        price: i128,
        interval: u64,
    ) -> u64 {
        merchant.require_auth();
        if price <= 0 {
            panic!("price must be positive");
        }
        if interval == 0 {
            panic!("interval must be positive");
        }

        let plan_id: u64 = env.storage().instance().get(&DataKey::NextPlanId).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextPlanId, &(plan_id + 1));

        let plan = PlanInfo {
            id: plan_id,
            merchant: merchant.clone(),
            name,
            token,
            price,
            interval,
            active: true,
        };

        env.storage().persistent().set(&(DataKey::Plan, plan_id), &plan);

        // Add to merchant plans
        let key = (DataKey::MerchantPlans, merchant.clone());
        let mut plans: Vec<u64> = env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env));
        plans.push_back(plan_id);
        env.storage().persistent().set(&key, &plans);

        // Publish event
        env.events().publish(
            (symbol_short!("plan_cre"), merchant, plan_id),
            price
        );

        plan_id
    }

    pub fn update_price(env: Env, merchant: Address, plan_id: u64, new_price: i128) {
        merchant.require_auth();
        if new_price <= 0 {
            panic!("price must be positive");
        }

        let key = (DataKey::Plan, plan_id);
        let mut plan: PlanInfo = env.storage().persistent().get(&key).unwrap_or_else(|| panic!("plan not found"));

        if plan.merchant != merchant {
            panic!("not plan merchant");
        }

        plan.price = new_price;
        env.storage().persistent().set(&key, &plan);

        env.events().publish(
            (symbol_short!("plan_upd"), merchant, plan_id),
            new_price
        );
    }

    pub fn set_active(env: Env, merchant: Address, plan_id: u64, active: bool) {
        merchant.require_auth();

        let key = (DataKey::Plan, plan_id);
        let mut plan: PlanInfo = env.storage().persistent().get(&key).unwrap_or_else(|| panic!("plan not found"));

        if plan.merchant != merchant {
            panic!("not plan merchant");
        }

        plan.active = active;
        env.storage().persistent().set(&key, &plan);

        env.events().publish(
            (symbol_short!("plan_act"), merchant, plan_id),
            active
        );
    }

    pub fn get_plan(env: Env, plan_id: u64) -> PlanInfo {
        let key = (DataKey::Plan, plan_id);
        env.storage().persistent().get(&key).unwrap_or_else(|| panic!("plan not found"))
    }

    pub fn list_plans_for_merchant(env: Env, merchant: Address) -> Vec<u64> {
        let key = (DataKey::MerchantPlans, merchant);
        env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env))
    }
}
