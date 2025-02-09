import pandas as pd
import joblib
from typing import Dict, Any, Tuple, List
from datetime import datetime

class FraudDetector:
    def __init__(self, models_dir: str = 'models/'):
        self.models = self._load_models(models_dir)
        self.training_stats = {
            'median': 5292.245,  # From your example
            'std': 1000  # You should replace this with actual value
        }
    
    def _load_models(self, models_dir: str) -> Dict:
        model_names = ['RandomForest', 'GradientBoosting', 'XGBoost', 'LogisticRegression']
        return {
            name: joblib.load(f"{models_dir}{name}_model.joblib")
            for name in model_names
        }
    
    def check_compliance(self, expense: Dict[str, Any]) -> Dict[str, Any]:
        flags = {}
        
        # Check budget
        cat = expense.get('category')
        amt = expense.get('amount')
        if cat in ALLOWED_BUDGETS and amt > ALLOWED_BUDGETS[cat]:
            flags['Over Budget'] = f"Amount {amt} exceeds budget {ALLOWED_BUDGETS[cat]}"
            
        # Check for outliers
        if amt > (self.training_stats['median'] + 3 * self.training_stats['std']):
            flags['Outlier'] = f"Amount {amt} is unusually high"
            
        return flags
    
    def predict(self, expense: Dict[str, Any]) -> Dict[str, Any]:
        df = pd.DataFrame([expense])
        
        predictions = {}
        confidences = {}
        
        for name, model in self.models.items():
            pred = model.predict(df)[0]
            prob = max(model.predict_proba(df)[0]) * 100
            predictions[name] = "Violation" if pred == 1 else "Normal"
            confidences[name] = prob
            
        compliance_flags = self.check_compliance(expense)
        
        return {
            "predictions": predictions,
            "confidences": confidences,
            "compliance_flags": compliance_flags,
            "is_suspicious": any(pred == "Violation" for pred in predictions.values())
        }
