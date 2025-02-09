from src.bill_validator import BillValidator
from src.fraud_detector import FraudDetector
from typing import Dict, Any

class ExpenseValidator:
    def __init__(self, openai_api_key: str, assistant_id: str):
        self.bill_validator = BillValidator(openai_api_key, assistant_id)
        self.fraud_detector = FraudDetector()
    
    def validate_expense(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates both bill compliance and fraud detection
        
        Sample input:
        {
            "bill_data": {
                "invoice_number": "X33",
                "invoice_date": "2024-02-07",
                ...
            },
            "expense_data": {
                "expense_id": 201,
                "employee_id": 1500,
                "amount": 7500.00,
                "department": "Engineering",
                ...
            }
        }
        """
        # Validate bill
        bill_result = self.bill_validator.validate_bill(data["bill_data"])
        
        # Check for fraud
        fraud_result = self.fraud_detector.predict(data["expense_data"])
        
        return {
            "bill_validation": bill_result,
            "fraud_detection": fraud_result,
            "overall_status": "rejected" if (
                not bill_result.get("bill_valid", False) or 
                fraud_result["is_suspicious"]
            ) else "approved"
        }

# Usage example:
if __name__ == "__main__":
    validator = ExpenseValidator(
        openai_api_key="your_key_here",
        assistant_id="your_assistant_id_here"
    )
    
    # Example input
    input_data = {
        "bill_data": {
            "invoice_number": "X33",
            "invoice_date": "2024-02-07",
            "due_date": "2024-02-20",
            "seller": {
                "name": "Sleek Bill",
                "address": "Long Business Co, XYZ Building, New Delhi, India",
                "gst_number": "27AABQA12S4A1Z5",
                "contact": "+91 9876543210"
            },
            # ... rest of the bill data
        },
        "expense_data": {
            "expense_id": 201,
            "employee_id": 1500,
            "amount": 7500.00,
            "department": "Engineering",
            "category": "Travel",
            # ... rest of the expense data
        }
    }
    
    result = validator.validate_expense(input_data)
    print(result)