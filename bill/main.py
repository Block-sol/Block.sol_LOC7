import asyncio
import json
from typing import Dict, Any
from services.expense_service import ExpenseValidationService
from utils.date_features import DateFeatureExtractor

async def validate_expense_and_tax(
    expense_data: Dict[str, Any],
    bill_data: Dict[str, Any],
    model_path: str,
    openai_key: str,
    assistant_id: str
) -> Dict[str, Any]:
    """
    Main function to validate both expense and tax compliance.
    """
    service = ExpenseValidationService(
        model_path=model_path,
        openai_key=openai_key,
        assistant_id=assistant_id
    )
    
    result = await service.validate_expense_and_tax(expense_data, bill_data)
    return result

async def main():
    # Sample input data
    expense_data = {
        'expense_id': 201,
        'employee_id': 1500,
        'amount': 7500.00,
        'receipt_quality': 0.65,
        'ocr_confidence': 0.90,
        'previous_violations': 1,
        'department': 'Engineering',
        'category': 'Travel',
        'currency': 'INR',
        'vendor_country': 'US',
        'payment_method': 'Credit Card',
        'expense_date': '2024-02-08',
        'submission_date': '2024-02-08',
        'requires_approval': 1,
        'has_receipt': 1,
        'manual_review_required': 0,
        'notes': ''
    }
    
    bill_data = {
        "invoice_number": "X33",
        "invoice_date": "2024-02-07",
        "due_date": "2024-02-20",
        "seller": {
            "name": "Sleek Bill",
            "address": "Long Business Co, XYZ Building, New Delhi, India",
            "gst_number": "27AABQA12S4A1Z5",
            "contact": "+91 9876543210"
        },
        "buyer": {
            "name": "AB Company",
            "address": "ABC Tower, Mumbai, India",
            "gst_number": "27AAAPA1234A1Z5",
            "contact": "+91 9123456789"
        },
        "bill_items": [
            {
                "description": "Service 1",
                "hsn_sac": "9983",
                "quantity": 2,
                "rate": 5000,
                "subtotal": 10000,
                "gst_rate": 18,
                "gst_amount": 1800,
                "total": 11800
            }
        ],
        "subtotal": 10000,
        "gst_total": 1800,
        "grand_total": 11800,
        "payment_terms": "Payment due in 15 days",
        "signature": "Authorized Signatory"
    }
    
    # Configuration
    MODEL_PATH = "models"
    OPENAI_KEY = "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"
    ASSISTANT_ID = "asst_EpFa1gBPouBslsTcGOsLBEGE"
    
    result = await validate_expense_and_tax(
        expense_data=expense_data,
        bill_data=bill_data,
        model_path=MODEL_PATH,
        openai_key=OPENAI_KEY,
        assistant_id=ASSISTANT_ID
    )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())