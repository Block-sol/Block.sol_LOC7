import joblib
import pandas as pd
from utils.date_features import DateFeatureExtractor
from typing import Dict, Any

class ExpenseValidationService:
    def __init__(self, model_path: str, openai_key: str, assistant_id: str):
        """
        Initialize the expense validation service.
        
        Args:
            model_path: Path to saved ML models
            openai_key: OpenAI API key
            assistant_id: OpenAI Assistant ID
        """
        self.model_path = model_path
        self.openai_key = openai_key
        self.assistant_id = assistant_id
        self.models = self._load_models(model_path)
        
    def _load_models(self, model_path: str) -> Dict[str, Any]:
        """
        Load all required ML models.
        
        Args:
            model_path: Path to model files
            
        Returns:
            Dictionary of loaded models
        """
        models = {}
        try:
            for name in ['XGBoost', 'RandomForest', 'LogisticRegression', 'GradientBoosting']:
                models[name] = joblib.load(f"{model_path}/{name}_model.joblib")
        except Exception as e:
            raise RuntimeError(f"Failed to load models: {str(e)}")
        return models
        
    async def validate_expense_and_tax(
        self,
        expense_data: Dict[str, Any],
        bill_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate both expense and tax compliance.
        
        Args:
            expense_data: Dictionary containing expense information
            bill_data: Dictionary containing bill information
            
        Returns:
            Dictionary containing validation results
        """
        # Convert input data to DataFrame
        expense_df = pd.DataFrame([expense_data])
        
        # Apply transformations
        date_extractor = DateFeatureExtractor()
        expense_features = date_extractor.transform(expense_df)
        
        # Make predictions
        fraud_score = self.models['fraud'].predict_proba(expense_features)[0][1]
        compliance_score = self.models['compliance'].predict_proba(expense_features)[0][1]
        tax_score = self.models['tax'].predict_proba(expense_features)[0][1]
        
        return {
            'fraud_risk_score': float(fraud_score),
            'compliance_score': float(compliance_score),
            'tax_compliance_score': float(tax_score),
            'validation_status': 'success'
        }
