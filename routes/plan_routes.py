from fastapi import APIRouter
from controllers.plan_controller import PlanController

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.get("/", response_model=list)
async def get_plans():
    return await PlanController.get_plans()

@router.post("/create-subscriptions", response_model=dict)
async def create_subscriptions(data: dict):
    return await PlanController.create_subscriptions(data)