#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, IntoVal, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SubStatus {
    Active = 0,
    Cancelled = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SubscriptionInfo {
    pub id: u64,
    pub subscriber: Address,
    pub plan_id: u64,
    pub balance: i128,
    pub last_charge: u64,
    pub created_at: u64,
    pub status: SubStatus,
}

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

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotSubscriber = 1,
    SubscriptionNotFound = 2,
    SubscriptionCancelled = 3,
    TooEarly = 4,
    InsufficientBalance = 5,
    InvalidAmount = 6,
    PlanNotFound = 7,
    PlanInactive = 8,
    AlreadyInitialized = 9,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Registry,
    SubCounter,
    Subscription,
    UserSubs,
    MerchantSubs,
}

// Minimal clients to avoid circular imports during tests
pub struct MerchantRegistryClient {
    env: Env,
    address: Address,
}

impl MerchantRegistryClient {
    pub fn new(env: &Env, address: &Address) -> Self {
        Self {
            env: env.clone(),
            address: address.clone(),
        }
    }

    pub fn get_plan(&self, plan_id: u64) -> PlanInfo {
        self.env.invoke_contract(
            &self.address,
            &Symbol::new(&self.env, "get_plan"),
            soroban_sdk::vec![&self.env, plan_id.into_val(&self.env)],
        )
    }
}

pub struct TokenClient {
    env: Env,
    address: Address,
}

impl TokenClient {
    pub fn new(env: &Env, address: &Address) -> Self {
        Self {
            env: env.clone(),
            address: address.clone(),
        }
    }

    pub fn transfer(&self, from: &Address, to: &Address, amount: &i128) {
        self.env.invoke_contract::<()>(
            &self.address,
            &symbol_short!("transfer"),
            soroban_sdk::vec![
                &self.env,
                from.into_val(&self.env),
                to.into_val(&self.env),
                amount.into_val(&self.env)
            ],
        );
    }
}

#[contract]
pub struct CycleVaultContract;

#[contractimpl]
impl CycleVaultContract {
    pub fn initialize(env: Env, admin: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::SubCounter, &0u64);
    }

    pub fn subscribe(env: Env, subscriber: Address, plan_id: u64, prefund_amount: i128) -> u64 {
        subscriber.require_auth();

        if prefund_amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry = MerchantRegistryClient::new(&env, &registry_addr);
        let plan = registry.get_plan(plan_id);

        if !plan.active {
            panic_with_error!(&env, Error::PlanInactive);
        }

        if prefund_amount < plan.price {
            panic_with_error!(&env, Error::InvalidAmount); // need to prefund at least one cycle
        }

        // Pull tokens from subscriber to vault contract
        let token = TokenClient::new(&env, &plan.token);
        token.transfer(
            &subscriber,
            &env.current_contract_address(),
            &prefund_amount,
        );

        let sub_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SubCounter)
            .unwrap_or(0)
            + 1;
        env.storage().instance().set(&DataKey::SubCounter, &sub_id);

        let now = env.ledger().timestamp();
        let sub_info = SubscriptionInfo {
            id: sub_id,
            subscriber: subscriber.clone(),
            plan_id,
            balance: prefund_amount,
            last_charge: now,
            created_at: now,
            status: SubStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&(DataKey::Subscription, sub_id), &sub_info);

        // Map user subscriptions
        let user_key = (DataKey::UserSubs, subscriber.clone());
        let mut user_subs: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or_else(|| Vec::new(&env));
        user_subs.push_back(sub_id);
        env.storage().persistent().set(&user_key, &user_subs);

        // Map merchant subscriptions
        let merchant_key = (DataKey::MerchantSubs, plan.merchant.clone());
        let mut merchant_subs: Vec<u64> = env
            .storage()
            .persistent()
            .get(&merchant_key)
            .unwrap_or_else(|| Vec::new(&env));
        merchant_subs.push_back(sub_id);
        env.storage()
            .persistent()
            .set(&merchant_key, &merchant_subs);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "subscribe_processed"), sub_id),
            (subscriber, plan.merchant, prefund_amount),
        );

        sub_id
    }

    pub fn top_up(env: Env, subscriber: Address, sub_id: u64, amount: i128) {
        subscriber.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let sub_key = (DataKey::Subscription, sub_id);
        let mut sub: SubscriptionInfo =
            env.storage().persistent().get(&sub_key).unwrap_or_else(|| {
                panic_with_error!(&env, Error::SubscriptionNotFound);
            });

        if sub.subscriber != subscriber {
            panic_with_error!(&env, Error::NotSubscriber);
        }

        if sub.status == SubStatus::Cancelled {
            panic_with_error!(&env, Error::SubscriptionCancelled);
        }

        let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry = MerchantRegistryClient::new(&env, &registry_addr);
        let plan = registry.get_plan(sub.plan_id);

        let token = TokenClient::new(&env, &plan.token);
        token.transfer(&subscriber, &env.current_contract_address(), &amount);

        sub.balance += amount;
        env.storage().persistent().set(&sub_key, &sub);

        env.events()
            .publish((Symbol::new(&env, "top_up_processed"), sub_id), amount);
    }

    pub fn cancel(env: Env, subscriber: Address, sub_id: u64) {
        subscriber.require_auth();

        let sub_key = (DataKey::Subscription, sub_id);
        let mut sub: SubscriptionInfo =
            env.storage().persistent().get(&sub_key).unwrap_or_else(|| {
                panic_with_error!(&env, Error::SubscriptionNotFound);
            });

        if sub.subscriber != subscriber {
            panic_with_error!(&env, Error::NotSubscriber);
        }

        if sub.status == SubStatus::Cancelled {
            panic_with_error!(&env, Error::SubscriptionCancelled);
        }

        let refund_amount = sub.balance;
        sub.status = SubStatus::Cancelled;
        sub.balance = 0;
        env.storage().persistent().set(&sub_key, &sub);

        if refund_amount > 0 {
            let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
            let registry = MerchantRegistryClient::new(&env, &registry_addr);
            let plan = registry.get_plan(sub.plan_id);

            let token = TokenClient::new(&env, &plan.token);
            token.transfer(&env.current_contract_address(), &subscriber, &refund_amount);
        }

        env.events().publish(
            (Symbol::new(&env, "cancel_processed"), sub_id),
            refund_amount,
        );
    }

    pub fn charge(env: Env, caller: Address, sub_id: u64) {
        caller.require_auth();

        let sub_key = (DataKey::Subscription, sub_id);
        let mut sub: SubscriptionInfo =
            env.storage().persistent().get(&sub_key).unwrap_or_else(|| {
                panic_with_error!(&env, Error::SubscriptionNotFound);
            });

        if sub.status == SubStatus::Cancelled {
            panic_with_error!(&env, Error::SubscriptionCancelled);
        }

        let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry = MerchantRegistryClient::new(&env, &registry_addr);
        let plan = registry.get_plan(sub.plan_id);

        if !plan.active {
            panic_with_error!(&env, Error::PlanInactive);
        }

        let now = env.ledger().timestamp();
        if now < sub.last_charge + plan.interval {
            panic_with_error!(&env, Error::TooEarly);
        }

        if sub.balance < plan.price {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        // Pull payment from vault to merchant
        let token = TokenClient::new(&env, &plan.token);
        token.transfer(&env.current_contract_address(), &plan.merchant, &plan.price);

        sub.balance -= plan.price;
        sub.last_charge = now;
        env.storage().persistent().set(&sub_key, &sub);

        env.events().publish(
            (Symbol::new(&env, "charge_processed"), sub_id),
            (plan.merchant, plan.price, now),
        );
    }

    pub fn is_due(env: Env, sub_id: u64) -> bool {
        let sub_key = (DataKey::Subscription, sub_id);
        let sub: SubscriptionInfo = match env.storage().persistent().get(&sub_key) {
            Some(s) => s,
            None => return false,
        };

        if sub.status == SubStatus::Cancelled {
            return false;
        }

        let registry_addr: Address = match env.storage().instance().get(&DataKey::Registry) {
            Some(a) => a,
            None => return false,
        };

        let registry = MerchantRegistryClient::new(&env, &registry_addr);
        let plan = registry.get_plan(sub.plan_id);

        if !plan.active {
            return false;
        }

        let now = env.ledger().timestamp();
        now >= sub.last_charge + plan.interval && sub.balance >= plan.price
    }

    pub fn next_charge_in(env: Env, sub_id: u64) -> i64 {
        let sub_key = (DataKey::Subscription, sub_id);
        let sub: SubscriptionInfo = env.storage().persistent().get(&sub_key).unwrap_or_else(|| {
            panic_with_error!(&env, Error::SubscriptionNotFound);
        });

        if sub.status == SubStatus::Cancelled {
            panic_with_error!(&env, Error::SubscriptionCancelled);
        }

        let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry = MerchantRegistryClient::new(&env, &registry_addr);
        let plan = registry.get_plan(sub.plan_id);

        let now = env.ledger().timestamp();
        let due_time = sub.last_charge + plan.interval;
        (due_time as i64) - (now as i64)
    }

    pub fn get_subscription(env: Env, sub_id: u64) -> SubscriptionInfo {
        let sub_key = (DataKey::Subscription, sub_id);
        env.storage().persistent().get(&sub_key).unwrap_or_else(|| {
            panic_with_error!(&env, Error::SubscriptionNotFound);
        })
    }

    pub fn list_subscriptions_for(env: Env, subscriber: Address) -> Vec<u64> {
        let key = (DataKey::UserSubs, subscriber);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn list_subscriptions_for_merchant(
        env: Env,
        _registry: Address,
        merchant: Address,
    ) -> Vec<u64> {
        let key = (DataKey::MerchantSubs, merchant);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod test;
