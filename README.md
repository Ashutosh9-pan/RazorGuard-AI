🛡️ RazorGuard AI — Intelligent Payment Risk Manager

A defense-focused payment risk management prototype that analyzes transaction signals, estimates risk, explains detected signals, and recommends an appropriate defensive action.

Built for the Razorpay AI Buildathon Track 2: AI Risk Manager.

RazorGuard AI is a defense-focused payment risk management prototype built for the Razorpay AI Buildathon Track 2: AI Risk Manager. It analyzes transaction signals, predicts the probability of risk, explains the main risk factors, and recommends an action such as Allow, Step-up Verification, or Hold for Manual Review.

🖥️ Product Screenshots

Dashboard



HIGH-Risk Detection



MEDIUM-Risk Action



LOW-Risk Action



Risk Insights & Analytics



Transaction Audit Trail



✨ Highlights

🤖 Random Forest risk classifier trained on a synthetic transaction dataset

📊 Held-out validation/testing metrics with precision, recall, F1 and confusion matrix

🎚️ Threshold tuning on a validation split to balance precision and recall

🔎 Explainable risk factors based on transaction/account signals

⚡ Flask REST API for real-time transaction analysis

🧾 In-memory transaction audit trail with CSV export from the dashboard

💰 Amount-at-risk / exposure estimate in the UI

📈 Risk distribution, activity trend and model performance views

🧪 HIGH / MEDIUM / LOW test scenarios for demo validation

🏗️ Architecture

                    ┌──────────────────────┐
                    │   Web Dashboard      │
                    │ HTML / CSS / JS      │
                    └──────────┬───────────┘
                               │ POST /api/analyze
                               ▼
                    ┌──────────────────────┐
                    │      Flask API       │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │     Risk Engine      │
                    │  Model + Rule-based  │
                    │      Explanation     │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │  Random Forest Model │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Risk Score + Level   │
                    │ Reasons + Action     │
                    └──────────────────────┘

🔄 Risk Decision Flow

Transaction Input
      ↓
Feature Extraction
      ↓
Random Forest Probability
      ↓
Risk Score (0–100)
      ↓
┌───────────────┬──────────────────┬──────────────────┐
│ LOW           │ MEDIUM           │ HIGH             │
│ < 40          │ 40–69.99         │ ≥ 70             │
│ ALLOW         │ STEP-UP          │ HOLD             │
└───────────────┴──────────────────┴──────────────────┘

📦 Project Structure

RazorGuard-AI/
├── data/
│   └── transactions.csv
├── models/
│   └── razorguard_improved_model.joblib
├── src/
│   └── risk_engine.py
├── app/
│   ├── app.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── style.css
│       └── script.js
├── notebooks/
├── requirements.txt
└── README.md

🧠 Model

The prototype uses RandomForestClassifier with class balancing. The improved training setup uses:

400 trees

max depth: 10

minimum samples split: 8

minimum samples leaf: 3

class_weight="balanced"

max_features="sqrt"

random_state=42

The dataset contains transaction/account signals such as:

transaction amount

account age

transactions in the last 24 hours

failed transactions in the last 24 hours

device changes in the last 30 days

location mismatch

international transaction flag

previous chargebacks

The dataset is synthetic and intended for prototype/testing purposes only.

📊 Model Evaluation

The model was trained with a 60/20/20 train/validation/test split. The validation set was used for threshold tuning and the final test set remained untouched for final evaluation.

Final held-out test results

Metric

Result

Accuracy

78.80%

Precision

36.65%

Recall

63.45%

F1 Score

46.46%

False Positive Rate

18.60%

False Positives

318

False Negatives

106

True Positives

184

True Negatives

1392

Decision Threshold

0.52

These metrics come from the current synthetic prototype dataset and should not be interpreted as production fraud-detection performance.

🔍 Top Risk Signals

Current model feature importance shows the strongest contribution from:

previous_chargebacks

location_mismatch

amount

account_age_days

device_changes_30d

transactions_24h

failed_transactions_24h

international_transaction

🚦 Risk Actions

HIGH

Action: Hold — Manual review and additional verification required

Triggered when the model risk score is at least 70.

MEDIUM

Action: Step-up verification — Request additional verification

Triggered for scores from 40 up to 70.

LOW

Action: Allow — Continue transaction and monitor

Triggered below a risk score of 40.

🔌 API Endpoints

Health Check

GET /api/health

Model Metrics

GET /api/metrics

Analyze Transaction

POST /api/analyze
Content-Type: application/json

Example request:

{
  "amount": 1250,
  "account_age_days": 12,
  "transactions_24h": 15,
  "failed_transactions_24h": 4,
  "device_changes_30d": 3,
  "location_mismatch": 1,
  "international_transaction": 1,
  "previous_chargebacks": 1
}

Audit Trail

GET /api/audit
DELETE /api/audit

🚀 Local Setup

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RazorGuard-AI

2. Create the virtual environment

python -m venv venv

3. Install dependencies

.\venv\Scripts\python.exe -m pip install -r requirements.txt

4. Start the application

.\venv\Scripts\python.exe app\app.py

Open:

http://127.0.0.1:5000

🧪 Demo Test Cases

HIGH-risk transaction

{
  "amount": 1250,
  "account_age_days": 12,
  "transactions_24h": 15,
  "failed_transactions_24h": 4,
  "device_changes_30d": 3,
  "location_mismatch": 1,
  "international_transaction": 1,
  "previous_chargebacks": 1
}

Expected demo behavior: HIGH risk with multiple detected risk signals and a HOLD recommendation.

For the demo, also test representative LOW and MEDIUM transactions through the dashboard to show all three decision paths.

💸 False-Positive Awareness

The dashboard includes a false-positive cost simulator so reviewers can see how incorrect blocks can create operational cost. This is intentionally included because a useful risk system must consider both missed risky transactions and legitimate transactions that are incorrectly flagged.

✅ Demo Notes

The screenshots show representative HIGH, MEDIUM, and LOW outcomes generated by the running prototype. The displayed audit history is session-based and reflects transactions analyzed during testing.

⚠️ Limitations

This is a prototype, not a production payment-fraud system.

Training data is synthetic.

The audit trail is stored in memory and is cleared when the server restarts.

No payment processor is connected.

No real customer or card data is used.

Model performance may change significantly on real-world data.

Production deployment would require stronger security, monitoring, data governance, model drift checks, access controls and persistent storage.

🔮 Future Improvements

Add a larger, more realistic labeled dataset

Calibrate probabilities and optimize threshold against business cost

Add persistent audit storage

Add model versioning and drift monitoring

Add authentication and role-based access

Add automated feedback from reviewed transactions

Integrate with a real payment event stream in a controlled environment

🛠️ Tech Stack

Frontend: HTML5, CSS3, JavaScript

Backend: Python, Flask, Flask-CORS

ML: scikit-learn, Random Forest, NumPy, pandas, joblib

👨‍💻 Author

Ashutosh Panwar

B.Tech CSE Graduate | AI/ML Developer | Data Analyst | Android Developer

Buildathon Note

RazorGuard AI is a defensive risk-management prototype created for the Razorpay AI Buildathon Track 2. It focuses on identifying potentially risky transactions, explaining risk signals, and selecting an appropriate defensive response.