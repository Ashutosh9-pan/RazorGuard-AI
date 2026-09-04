import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# -----------------------------
# 1. Load dataset
# -----------------------------
DATA_PATH = "data/transactions.csv"
MODEL_PATH = "models/razorguard_model.joblib"

df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("RazorGuard AI - Risk Detection Model")
print("=" * 60)

print(f"Dataset shape: {df.shape}")

# -----------------------------
# 2. Features and target
# -----------------------------
X = df.drop("is_risky", axis=1)
y = df["is_risky"]

# -----------------------------
# 3. Train / Test split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples : {len(X_test)}")

# -----------------------------
# 4. Train Random Forest
# -----------------------------
model = RandomForestClassifier(
    n_estimators=250,
    max_depth=12,
    min_samples_split=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

print("\nTraining model...")
model.fit(X_train, y_train)

# -----------------------------
# 5. Predictions
# -----------------------------
y_pred = model.predict(X_test)

# -----------------------------
# 6. Evaluation
# -----------------------------
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print("\n" + "=" * 60)
print("MODEL PERFORMANCE - HELD-OUT TEST SET")
print("=" * 60)

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    target_names=["Normal", "Risky"],
    zero_division=0
))

# -----------------------------
# 7. Feature importance
# -----------------------------
importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
}).sort_values("importance", ascending=False)

print("\nFeature Importance:")
print(importance.to_string(index=False))

# -----------------------------
# 8. Save model
# -----------------------------
os.makedirs("models", exist_ok=True)

joblib.dump(
    {
        "model": model,
        "features": list(X.columns)
    },
    MODEL_PATH
)

print("\n" + "=" * 60)
print(f"Model saved successfully:")
print(MODEL_PATH)
print("=" * 60)