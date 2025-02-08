# features/date_features.py
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class DateFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Custom transformer for extracting features from date columns.
    Inherits from sklearn's BaseEstimator and TransformerMixin.
    """
    
    def fit(self, X, y=None):
        """Nothing to fit, just return self."""
        return self
        
    def transform(self, X):
        """
        Transform date columns into multiple feature columns.
        
        Args:
            X: DataFrame containing 'submission_date' and 'expense_date' columns
            
        Returns:
            DataFrame with extracted date features
        """
        X = X.copy()
        
        # Convert string dates to datetime
        X['submission_date'] = pd.to_datetime(X['submission_date'])
        X['expense_date'] = pd.to_datetime(X['expense_date'])
        
        # Calculate submission delay
        X['submission_delay'] = (X['submission_date'] - X['expense_date']).dt.days
        
        # Extract day of week (0-6, where 0 is Monday)
        X['day_of_week'] = X['expense_date'].dt.dayofweek
        
        # Mark weekends
        X['is_weekend'] = X['day_of_week'].isin([5, 6]).astype(int)
        
        # Extract month and quarter
        X['month'] = X['expense_date'].dt.month
        X['quarter'] = X['expense_date'].dt.quarter
        
        # Check if expense is at month end
        X['is_month_end'] = X['expense_date'].dt.is_month_end.astype(int)
        
        # Drop original date columns after feature extraction
        return X.drop(['submission_date', 'expense_date'], axis=1)
