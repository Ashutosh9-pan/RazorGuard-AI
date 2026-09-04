from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sys
import os

# ==========================================
# Allow importing risk_engine from src
# ==========================================

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "src")
    )
)

from risk_engine import analyze_transaction


# ==========================================
# Flask Application
# ==========================================

app = Flask(__name__)
CORS(app)


# ==========================================
# Transaction Audit Trail
# ==========================================

audit_log = []


# ==========================================
# Home / Dashboard
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


# ==========================================
# Health Check API
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model": "RazorGuard Random Forest"
    })


# ==========================================
# Model Metrics API
# ==========================================

@app.route("/api/metrics", methods=["GET"])
def metrics():

    return jsonify({
        "model": "RazorGuard Improved Random Forest",
        "evaluation": "Held-out Test Set",

        "dataset": {
            "total_records": 10000,
            "training_records": 6000,
            "validation_records": 2000,
            "test_records": 2000
        },

        "performance": {
            "accuracy": 0.7880,
            "precision": 0.3665,
            "recall": 0.6345,
            "f1_score": 0.4646
        },

        "confusion_matrix": {
            "true_negatives": 1392,
            "false_positives": 318,
            "false_negatives": 106,
            "true_positives": 184
        },

        "false_positive_rate": 0.1860,

        "threshold": 0.52,

        "top_risk_signals": [
            {
                "feature": "previous_chargebacks",
                "importance": 0.338218
            },
            {
                "feature": "location_mismatch",
                "importance": 0.163344
            },
            {
                "feature": "amount",
                "importance": 0.126924
            },
            {
                "feature": "account_age_days",
                "importance": 0.111544
            },
            {
                "feature": "device_changes_30d",
                "importance": 0.096297
            }
        ]
    })


# ==========================================
# Transaction Analysis API
# ==========================================

@app.route("/api/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    # Check request body
    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    # Required transaction features
    required_features = [
        "amount",
        "account_age_days",
        "transactions_24h",
        "failed_transactions_24h",
        "device_changes_30d",
        "location_mismatch",
        "international_transaction",
        "previous_chargebacks"
    ]

    # Check missing fields
    missing = [
        feature
        for feature in required_features
        if feature not in data
    ]

    if missing:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing
        }), 400

    try:

        # Convert incoming values to numbers
        transaction = {
            feature: float(data[feature])
            for feature in required_features
        }

        # Binary fields
        transaction["location_mismatch"] = int(
            transaction["location_mismatch"]
        )

        transaction["international_transaction"] = int(
            transaction["international_transaction"]
        )

        # ==========================================
        # Run Risk Analysis
        # ==========================================

        result = analyze_transaction(transaction)

        # ==========================================
        # Create Audit Record
        # ==========================================

        audit_record = {
            "transaction_id": f"TXN-{len(audit_log) + 1:05d}",
            "transaction": transaction,
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "risk_probability": result["risk_probability"],
            "reasons": result["reasons"],
            "recommended_action": result["recommended_action"]
        }

        # ==========================================
        # Store Transaction Decision
        # ==========================================

        audit_log.insert(0, audit_record)

        # Keep only latest 50 transactions
        if len(audit_log) > 50:
            audit_log.pop()

        # ==========================================
        # API Response
        # ==========================================

        return jsonify({
            "success": True,
            "transaction": transaction,
            "analysis": result,
            "audit": {
                "transaction_id": audit_record["transaction_id"]
            }
        })

    except (ValueError, TypeError) as error:

        return jsonify({
            "error": "Invalid transaction data",
            "details": str(error)
        }), 400


# ==========================================
# Audit Trail API
# ==========================================

@app.route("/api/audit", methods=["GET"])
def get_audit_log():

    return jsonify({
        "success": True,
        "count": len(audit_log),
        "records": audit_log
    })
    
@app.route("/api/audit", methods=["DELETE"])
def clear_audit():
    global audit_log

    audit_log.clear()

    return jsonify({
        "success": True,
        "message": "Audit log cleared successfully",
        "count": 0
    })    


# ==========================================
# Run Application
# ==========================================

if __name__ == "__main__":

    print("=" * 60)
    print("RAZORGUARD AI - PAYMENT RISK API")
    print("=" * 60)

    print("Server : http://127.0.0.1:5000")
    print("Analyze: POST /api/analyze")
    print("Metrics: GET  /api/metrics")
    print("Audit  : GET  /api/audit")

    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )