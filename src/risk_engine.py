import joblib
import pandas as pd

MODEL_PATH = "models/razorguard_improved_model.joblib"

# Load trained model
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
features = bundle["features"]


def analyze_transaction(transaction):
    """
    Analyze a single payment transaction and return:
    - risk score
    - risk level
    - risk probability
    - explainable risk factors
    - recommended defensive action
    """

    # Create DataFrame using the exact training feature order
    df = pd.DataFrame([transaction], columns=features)

    # Probability of risky class
    risk_probability = model.predict_proba(df)[0][1]

    # Convert probability to 0-100 score
    risk_score = round(risk_probability * 100, 2)

    # Risk level
    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Recommended defensive action
    if risk_level == "HIGH":
        recommended_action = (
            "HOLD — Manual review and additional verification required"
        )
    elif risk_level == "MEDIUM":
        recommended_action = (
            "STEP-UP VERIFICATION — Request additional verification"
        )
    else:
        recommended_action = (
            "ALLOW — Continue transaction and monitor"
        )

    # Explainable risk factors
    reasons = []

    if transaction["amount"] > 500:
        reasons.append("High transaction amount")

    if transaction["transactions_24h"] >= 10:
        reasons.append("Unusually high transaction frequency")

    if transaction["failed_transactions_24h"] >= 3:
        reasons.append("Multiple failed transactions")

    if transaction["device_changes_30d"] >= 2:
        reasons.append("Multiple device changes")

    if transaction["location_mismatch"] == 1:
        reasons.append("Location mismatch detected")

    if transaction["international_transaction"] == 1:
        reasons.append("International transaction")

    if transaction["previous_chargebacks"] >= 1:
        reasons.append("Previous chargeback history")

    if transaction["account_age_days"] < 30:
        reasons.append("New account")

    # Default message when no risk factors are detected
    if not reasons:
        reasons.append("No major risk indicators detected")

    # Final analysis response
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_probability": round(risk_probability, 4),
        "reasons": reasons,
        "recommended_action": recommended_action
    }


# Test transaction
if __name__ == "__main__":

    test_transaction = {
        "amount": 1250,
        "account_age_days": 12,
        "transactions_24h": 15,
        "failed_transactions_24h": 4,
        "device_changes_30d": 3,
        "location_mismatch": 1,
        "international_transaction": 1,
        "previous_chargebacks": 1
    }

    result = analyze_transaction(test_transaction)

    print("=" * 60)
    print("RAZORGUARD AI - TRANSACTION RISK ANALYSIS")
    print("=" * 60)

    print(f"Risk Score        : {result['risk_score']}/100")
    print(f"Risk Level        : {result['risk_level']}")
    print(f"Risk Probability  : {result['risk_probability']}")
    print(f"Recommended Action: {result['recommended_action']}")

    print("\nRisk Factors:")
    for reason in result["reasons"]:
        print(f"  • {reason}")

    print("=" * 60)