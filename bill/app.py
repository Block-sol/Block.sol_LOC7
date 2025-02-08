from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import joblib
import os
import pandas as pd
from datetime import datetime
import uvicorn
from transformers import DateFeatureExtractor


app = FastAPI()

# ---------------------------
# Define the expected expense input
# ---------------------------
class ExpenseInput(BaseModel):
    expense_id: Optional[int] = None
    employee_id: Optional[int] = None
    amount: float
    receipt_quality: float
    ocr_confidence: float
    previous_violations: int
    department: str
    category: str
    currency: str
    vendor_country: str
    payment_method: str
    expense_date: str  # expected format: "YYYY-MM-DD"
    submission_date: str  # expected format: "YYYY-MM-DD"
    requires_approval: int
    has_receipt: int
    manual_review_required: int
    notes: Optional[str] = ""

# ---------------------------
# Global constants for rule‐based checks
# ---------------------------
allowed_budgets = {
    "Travel": 10000,
    "Meals": 3000,
    "Supplies": 5000
}

allowed_categories = {
    "Engineering": ["Travel", "Meals", "Supplies"],
    "IT": ["Travel", "Supplies"],
    "Finance": ["Travel", "Meals"],
    "HR": ["Meals"],
    "Operations": ["Travel", "Meals", "Supplies"],
    "Sales": ["Travel", "Meals"],
    "Marketing": ["Travel", "Meals", "Supplies"]
}

# Dummy training stats (replace with actual values if available)
training_stats = {
    "median": 5000,
    "std": 2500
}



# ---------------------------
# Compliance check function (rule-based)
# ---------------------------
def compliance_check(expense, allowed_budgets, allowed_categories, training_stats=None):
    flags = {}
    cat = expense.get('category', None)
    dept = expense.get('department', None)
    amt = expense.get('amount', 0)
    notes = expense.get('notes', "").strip()
    
    # Rule 1: Over-budget check
    if cat in allowed_budgets and amt > allowed_budgets[cat]:
        flags['Over Budget'] = f"Claimed amount {amt} INR exceeds allowed budget {allowed_budgets[cat]} INR for {cat}."
    # Rule 2: Unauthorized category check
    if dept in allowed_categories and cat not in allowed_categories[dept]:
        flags['Unauthorized Category'] = f"Category {cat} is not allowed for department {dept}."
    # Rule 3: Missing justification for high expense
    if cat in allowed_budgets and amt > allowed_budgets[cat] and notes == "":
        flags['Missing Justification'] = "High amount claimed but justification (notes) is missing."
    # Rule 4: Outlier detection (if training stats provided)
    if training_stats is not None:
        median_amt = training_stats.get('median', 0)
        std_amt = training_stats.get('std', 0)
        threshold = median_amt + 3 * std_amt
        if amt > threshold:
            flags['Outlier'] = f"Claimed amount {amt} INR is unusually high compared to median {median_amt} INR."
    return flags

# ---------------------------
# Load all saved models into a dictionary
# ---------------------------
MODEL_DIR = "models"
model_names = ["RandomForest", "GradientBoosting", "XGBoost", "LogisticRegression"]
models = {}

for name in model_names:
    model_path = os.path.join(MODEL_DIR, f"{name}_model.joblib")
    if os.path.exists(model_path):
        models[name] = joblib.load(model_path)
        print(f"Loaded {name} model from {model_path}")
    else:
        print(f"Warning: Model file not found: {model_path}")

# These are the features that the ML pipelines expect (the pipelines were trained on these)
required_features = [
    'amount', 'receipt_quality', 'ocr_confidence', 'previous_violations',
    'department', 'category', 'currency', 'vendor_country', 'payment_method',
    'expense_date', 'submission_date',
    'requires_approval', 'has_receipt', 'manual_review_required'
]

# ---------------------------
# Define the prediction API endpoint
# ---------------------------
@app.post("/predict")
def predict_expense(expense: ExpenseInput):
    # Convert the incoming expense data into a dictionary and DataFrame
    expense_dict = expense.dict()
    df_input = pd.DataFrame([expense_dict])
    
    # Filter only the features required by the model pipelines
    try:
        df_model = df_input[required_features]
    except Exception as e:
        return {"error": f"Missing required fields for prediction: {str(e)}"}
    
    predictions = {}
    # Loop through each model and run predictions
    for name, model in models.items():
        try:
            pred = model.predict(df_model)[0]
            prob = max(model.predict_proba(df_model)[0]) * 100  # as percentage
            label = "Violation" if pred == 1 else "Normal"
            predictions[name] = {"label": label, "confidence": round(prob, 2)}
        except Exception as e:
            predictions[name] = {"error": str(e)}
    
    # Run the rule-based compliance check on the full expense data
    comp_flags = compliance_check(expense_dict, allowed_budgets, allowed_categories, training_stats)
    
    # Prepare a textual compliance report
    report_lines = []
    report_lines.append("Policy Compliance Report")
    report_lines.append(f"Expense ID: {expense_dict.get('expense_id', 'N/A')}")
    report_lines.append(f"Employee ID: {expense_dict.get('employee_id', 'N/A')} | Department: {expense_dict.get('department', 'N/A')}")
    report_lines.append(f"Expense Category & Amount: {expense_dict.get('category', 'N/A')} - {expense_dict.get('amount', 'N/A')} INR")
    if comp_flags:
        report_lines.append("Detected Violations:")
        for key, message in comp_flags.items():
            report_lines.append(f" - {key}: {message}")
        report_lines.append("Suggested Actions: Please review the expense policy, provide necessary justification and/or seek manager review.")
    else:
        report_lines.append("No Violations Detected.")
    report = "\n".join(report_lines)
    
    return {
        "predictions": predictions,
        "compliance_flags": comp_flags,
        "compliance_report": report
    }

# ---------------------------
# Run the API with: uvicorn app:app --reload
# ---------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
