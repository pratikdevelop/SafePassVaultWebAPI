from fastapi import APIRouter
from controllers.share_item_controller import ItemController

router = APIRouter(prefix="/share", tags=["Share Items"])

@router.post("/share-item", response_model=dict)
async def share_item(data: dict):
    return await ItemController.share_item(data)

@router.get("/items/{item_type}", response_model=list)
async def get_items(item_type: str):
    return await ItemController.get_items(item_type)