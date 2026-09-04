import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# -----------------------------------
# Paths
# -----------------------------------
DATA_PATH = "data/transactions.csv"
MODEL_PATH = "models/razorguard_model.joblib"

# -----------------------------------
# Load data and trained model
# -----------------------------------
df = pd.read_csv(DATA_PATH)

bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
features = bundle["features"]

X = df[features]
y = df["is_risky"]

# -----------------------------------
# Recreate the same held-out split
# -----------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# -----------------------------------
# Evaluate ONLY on held-out test set
# -----------------------------------
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)
recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)
f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

matrix = confusion_matrix(y_test, y_pred)

# -----------------------------------
# Print results
# -----------------------------------
print("=" * 65)
print("RAZORGUARD AI - MODEL EVALUATION")
print("=" * 65)

print("\nDataset:")
print(f"Total records       : {len(df)}")
print(f"Training records    : {len(X_train)}")
print(f"Held-out test       : {len(X_test)}")

print("\n" + "-" * 65)
print("HELD-OUT TEST SET PERFORMANCE")
print("-" * 65)

print(f"Accuracy            : {accuracy:.4f}")
print(f"Precision           : {precision:.4f}")
print(f"Recall              : {recall:.4f}")
print(f"F1 Score            : {f1:.4f}")

print("\n" + "-" * 65)
print("CONFUSION MATRIX")
print("-" * 65)

print("                 Predicted")
print("               Normal  Risky")
print(f"Actual Normal    {matrix[0][0]:5d}  {matrix[0][1]:5d}")
print(f"Actual Risky     {matrix[1][0]:5d}  {matrix[1][1]:5d}")

# -----------------------------------
# Classification report
# -----------------------------------
print("\n" + "-" * 65)
print("CLASSIFICATION REPORT")
print("-" * 65)

print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Normal", "Risky"],
        zero_division=0
    )
)

# -----------------------------------
# False-positive analysis
# -----------------------------------
tn, fp, fn, tp = matrix.ravel()

print("-" * 65)
print("FALSE-POSITIVE ANALYSIS")
print("-" * 65)

print(f"False Positives     : {fp}")
print(f"False Negatives     : {fn}")

if (fp + tn) > 0:
    false_positive_rate = fp / (fp + tn)
else:
    false_positive_rate = 0

print(f"False Positive Rate : {false_positive_rate:.4f}")

# -----------------------------------
# Feature importance
# -----------------------------------
importance = pd.DataFrame({
    "Feature": features,
    "Importance": model.feature_importances_
}).sort_values(
    "Importance",
    ascending=False
)

print("\n" + "-" * 65)
print("TOP RISK SIGNALS")
print("-" * 65)

for _, row in importance.iterrows():
    print(
        f"{row['Feature']:<30} "
        f"{row['Importance']:.4f}"
    )

print("\n" + "=" * 65)
print("Evaluation completed successfully.")
print("=" * 65)