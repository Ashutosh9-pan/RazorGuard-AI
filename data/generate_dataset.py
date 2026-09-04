import numpy as np
import pandas as pd

np.random.seed(42)

N = 10000

# Basic transaction features
amount = np.round(np.random.lognormal(mean=4.2, sigma=1.0, size=N), 2)
account_age_days = np.random.randint(1, 2000, N)
transactions_24h = np.random.poisson(4, N)
failed_transactions_24h = np.random.poisson(0.8, N)

device_changes_30d = np.random.poisson(0.5, N)
location_mismatch = np.random.binomial(1, 0.08, N)
international_transaction = np.random.binomial(1, 0.15, N)
previous_chargebacks = np.random.poisson(0.15, N)

# Create a risk signal from multiple independent factors
risk_score = (
    0.8 * (amount > 500).astype(int)
    + 1.2 * (transactions_24h >= 10).astype(int)
    + 1.5 * (failed_transactions_24h >= 3).astype(int)
    + 1.3 * (device_changes_30d >= 2).astype(int)
    + 2.0 * location_mismatch
    + 0.8 * international_transaction
    + 2.2 * (previous_chargebacks >= 1).astype(int)
    + 1.0 * (account_age_days < 30).astype(int)
)

# Add some randomness so the task isn't perfectly deterministic
risk_score += np.random.normal(0, 0.8, N)

# Convert risk signal into a probability
risk_probability = 1 / (1 + np.exp(-(risk_score - 3.2)))

# Generate target
is_risky = np.random.binomial(1, risk_probability)

df = pd.DataFrame({
    "amount": amount,
    "account_age_days": account_age_days,
    "transactions_24h": transactions_24h,
    "failed_transactions_24h": failed_transactions_24h,
    "device_changes_30d": device_changes_30d,
    "location_mismatch": location_mismatch,
    "international_transaction": international_transaction,
    "previous_chargebacks": previous_chargebacks,
    "is_risky": is_risky
})

# Save dataset
output_path = "data/transactions.csv"
df.to_csv(output_path, index=False)

print("=" * 55)
print("RazorGuard AI - Dataset Generated")
print("=" * 55)
print(f"Total transactions : {len(df)}")
print(f"Risky transactions  : {df['is_risky'].sum()}")
print(f"Normal transactions : {(df['is_risky'] == 0).sum()}")
print(f"Risk rate           : {df['is_risky'].mean() * 100:.2f}%")
print(f"Saved to            : {output_path}")
print("=" * 55)

print("\nFirst 5 transactions:")
print(df.head())

print("\nClass distribution:")
print(df["is_risky"].value_counts())