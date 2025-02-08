# transformers.py
from sklearn.base import BaseEstimator, TransformerMixin
import pandas as pd

class DateFeatureExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X['submission_date'] = pd.to_datetime(X['submission_date'])
        X['expense_date'] = pd.to_datetime(X['expense_date'])
        X['submission_delay'] = (X['submission_date'] - X['expense_date']).dt.days
        X['day_of_week'] = X['expense_date'].dt.dayofweek
        X['is_weekend'] = X['day_of_week'].isin([5, 6]).astype(int)
        X['month'] = X['expense_date'].dt.month
        X['quarter'] = X['expense_date'].dt.quarter
        X['is_month_end'] = X['expense_date'].dt.is_month_end.astype(int)
        return X.drop(['submission_date', 'expense_date'], axis=1)
