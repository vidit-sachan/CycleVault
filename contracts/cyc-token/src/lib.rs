#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Balance,
    Allowance,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        let key = (DataKey::Balance, id);
        env.storage().persistent().get(&key).unwrap_or(0i128)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        if amount < 0 {
            panic!("negative amount not allowed");
        }
        from.require_auth();

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .persistent()
            .set(&(DataKey::Balance, from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&(DataKey::Balance, to.clone()), &(to_balance + amount));

        // Emit event
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        if amount < 0 {
            panic!("negative amount not allowed");
        }
        spender.require_auth();

        let allowance_key = (DataKey::Allowance, from.clone(), spender.clone());

        if let Some(allowance) = env
            .storage()
            .persistent()
            .get::<_, AllowanceValue>(&allowance_key)
        {
            if env.ledger().sequence() > allowance.expiration_ledger {
                panic!("allowance expired");
            }
            if allowance.amount < amount {
                panic!("insufficient allowance");
            }
            let new_allowance = AllowanceValue {
                amount: allowance.amount - amount,
                expiration_ledger: allowance.expiration_ledger,
            };
            env.storage()
                .persistent()
                .set(&allowance_key, &new_allowance);
        } else {
            panic!("no allowance");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .persistent()
            .set(&(DataKey::Balance, from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&(DataKey::Balance, to.clone()), &(to_balance + amount));

        // Emit event
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) {
        if amount < 0 {
            panic!("negative amount not allowed");
        }
        from.require_auth();

        let allowance_key = (DataKey::Allowance, from.clone(), spender.clone());

        let val = AllowanceValue {
            amount,
            expiration_ledger,
        };

        env.storage().persistent().set(&allowance_key, &val);

        // Emit event
        env.events()
            .publish((Symbol::new(&env, "approve"), from, spender), amount);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        if amount < 0 {
            panic!("negative amount not allowed");
        }
        let admin = Self::admin(env.clone());
        admin.require_auth();

        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .persistent()
            .set(&(DataKey::Balance, to.clone()), &(to_balance + amount));

        // Emit event
        env.events().publish((symbol_short!("mint"), to), amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        if amount < 0 {
            panic!("negative amount not allowed");
        }
        from.require_auth();

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        env.storage()
            .persistent()
            .set(&(DataKey::Balance, from.clone()), &(from_balance - amount));

        // Emit event
        env.events().publish((symbol_short!("burn"), from), amount);
    }
}
