import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

DATA_PATH = "data/transactions.csv"
MODEL_PATH = "models/razorguard_improved_model.joblib"

# ---------------------------------------
# 1. Load dataset
# ---------------------------------------
df = pd.read_csv(DATA_PATH)

features = [column for column in df.columns if column != "is_risky"]

X = df[features]
y = df["is_risky"]

print("=" * 70)
print("RAZORGUARD AI - IMPROVED MODEL")
print("=" * 70)

# ---------------------------------------
# 2. 60% Train / 20% Validation / 20% Test
# ---------------------------------------

X_temp, X_test, y_temp, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

X_train, X_validation, y_train, y_validation = train_test_split(
    X_temp,
    y_temp,
    test_size=0.25,
    random_state=42,
    stratify=y_temp
)

print("\nDataset split:")
print(f"Training samples   : {len(X_train)}")
print(f"Validation samples : {len(X_validation)}")
print(f"Test samples       : {len(X_test)}")

# ---------------------------------------
# 3. Train improved Random Forest
# ---------------------------------------

model = RandomForestClassifier(
    n_estimators=400,
    max_depth=10,
    min_samples_split=8,
    min_samples_leaf=3,
    class_weight="balanced",
    max_features="sqrt",
    random_state=42,
    n_jobs=-1
)

print("\nTraining improved model...")
model.fit(X_train, y_train)

# ---------------------------------------
# 4. Validation probabilities
# ---------------------------------------

validation_probabilities = model.predict_proba(
    X_validation
)[:, 1]


# ---------------------------------------
# 5. Find best threshold
# ---------------------------------------

threshold_results = []

for threshold in np.arange(0.20, 0.81, 0.01):

    validation_predictions = (
        validation_probabilities >= threshold
    ).astype(int)

    precision = precision_score(
        y_validation,
        validation_predictions,
        zero_division=0
    )

    recall = recall_score(
        y_validation,
        validation_predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_validation,
        validation_predictions,
        zero_division=0
    )

    tn, fp, fn, tp = confusion_matrix(
        y_validation,
        validation_predictions
    ).ravel()

    false_positive_rate = fp / (fp + tn)

    threshold_results.append({
        "threshold": threshold,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "false_positive_rate": false_positive_rate
    })


threshold_df = pd.DataFrame(threshold_results)

# Select threshold using F1 score
best_row = threshold_df.loc[
    threshold_df["f1"].idxmax()
]

best_threshold = float(best_row["threshold"])

print("\n" + "-" * 70)
print("VALIDATION THRESHOLD SELECTION")
print("-" * 70)

print(f"Best threshold       : {best_threshold:.2f}")
print(f"Validation Precision : {best_row['precision']:.4f}")
print(f"Validation Recall    : {best_row['recall']:.4f}")
print(f"Validation F1        : {best_row['f1']:.4f}")
print(f"Validation FPR       : {best_row['false_positive_rate']:.4f}")


# ---------------------------------------
# 6. FINAL evaluation on untouched test
# ---------------------------------------

test_probabilities = model.predict_proba(
    X_test
)[:, 1]

test_predictions = (
    test_probabilities >= best_threshold
).astype(int)

accuracy = accuracy_score(
    y_test,
    test_predictions
)

precision = precision_score(
    y_test,
    test_predictions,
    zero_division=0
)

recall = recall_score(
    y_test,
    test_predictions,
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_predictions,
    zero_division=0
)

tn, fp, fn, tp = confusion_matrix(
    y_test,
    test_predictions
).ravel()

false_positive_rate = fp / (fp + tn)

print("\n" + "=" * 70)
print("FINAL PERFORMANCE - UNTOUCHED TEST SET")
print("=" * 70)

print(f"Accuracy            : {accuracy:.4f}")
print(f"Precision           : {precision:.4f}")
print(f"Recall              : {recall:.4f}")
print(f"F1 Score            : {f1:.4f}")
print(f"False Positives     : {fp}")
print(f"False Negatives     : {fn}")
print(f"False Positive Rate : {false_positive_rate:.4f}")

print("\nConfusion Matrix:")
print(
    f"True Negatives  : {tn}\n"
    f"False Positives : {fp}\n"
    f"False Negatives : {fn}\n"
    f"True Positives  : {tp}"
)


# ---------------------------------------
# 7. Feature importance
# ---------------------------------------

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_
}).sort_values(
    "importance",
    ascending=False
)

print("\n" + "-" * 70)
print("FEATURE IMPORTANCE")
print("-" * 70)

print(importance.to_string(index=False))


# ---------------------------------------
# 8. Save improved model
# ---------------------------------------

os.makedirs("models", exist_ok=True)

joblib.dump(
    {
        "model": model,
        "features": features,
        "threshold": best_threshold
    },
    MODEL_PATH
)

print("\n" + "=" * 70)
print("IMPROVED MODEL SAVED")
print("=" * 70)

print(f"Model path : {MODEL_PATH}")
print(f"Threshold  : {best_threshold:.2f}")
print("=" * 70)