from fastapi import HTTPException
from models import Plan, Subscription  # Assuming Beanie models
from typing import Dict, Any, List
from datetime import datetime, timedelta
import paypalrestsdk  # Requires configuration in config.py

class PlanController:
    @staticmethod
    async def get_plans() -> Dict[str, Any]:
        """Retrieve all subscription plans."""
        try:
            plans = await Plan.find_all().to_list()
            formatted_plans = [
                {
                    "id": plan.paypal_plan_id,
                    "title": plan.plan_name,
                    "amount": plan.amount / 100,  # Convert cents to dollars
                    "currency": plan.currency,
                    "interval": plan.interval,
                    "interval_count": plan.interval_count,
                    "features": plan.features,
                    "button_link": plan.button_link,
                    "button_text": plan.button_text,
                    "has_trial": plan.has_trial,
                    "query_params": plan.query_params,
                    "trial_link": plan.trial_link,
                    "trial_query_params": plan.trial_query_params,
                }
                for plan in plans
            ]
            return {"plans": formatted_plans}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unable to fetch plans: {str(e)}")

    @staticmethod
    async def create_subscription(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a subscription with PayPal integration."""
        user_id, plan_title, paypal_order_id = data["userId"], data["plan"], data["paypalOrderId"]
        
        try:
            # Configure PayPal SDK (assumes paypal_config in config.py)
            paypalrestsdk.configure({
                "mode": "sandbox",  # or "live"
                "client_id": os.getenv("PAYPAL_CLIENT_ID"),
                "client_secret": os.getenv("PAYPAL_CLIENT_SECRET"),
            })

            # Verify PayPal order
            order = paypalrestsdk.Order.find(paypal_order_id)
            if order.status != "COMPLETED":
                raise HTTPException(status_code=400, detail="Order not completed")

            # Check for existing subscription
            existing_subscription = await Subscription.find_one(Subscription.user_id == user_id)
            if existing_subscription:
                existing_subscription.subscription_status = "CANCELLED"
                existing_subscription.subscription_end = datetime.now()
                await existing_subscription.save()

            # Create new subscription
            new_subscription = Subscription(
                user_id=user_id,
                plan=plan_title,
                paypal_subscription_id=order.id,
                subscription_status=order.status,
                subscription_start=datetime.now(),
                subscription_expiry=PlanController._calculate_expiry_date(),
            )
            await new_subscription.insert()

            return {"message": "Subscription created successfully", "subscriptionId": str(new_subscription.id)}
        except paypalrestsdk.exceptions.ResourceNotFound:
            raise HTTPException(status_code=404, detail="PayPal order not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def _calculate_expiry_date() -> datetime:
        """Helper to calculate subscription expiry date."""
        return datetime.now() + timedelta(days=30)  # Assuming monthly subscriptions

    @staticmethod
    async def get_plan_details(plan_id: str) -> Dict[str, Any]:
        """Retrieve plan details for a user."""
        try:
            subscription_plan = await Subscription.find_one(Subscription.user_id == plan_id)
            plan_name = subscription_plan.plan if subscription_plan else "free"
            plan_details = await Plan.find_one(Plan.plan_name == plan_name)

            if not plan_details:
                return None

            combined_plan = {**subscription_plan.dict(), **plan_details.dict()} if subscription_plan else plan_details.dict()
            return combined_plan
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching plan details: {str(e)}")