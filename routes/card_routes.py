from fastapi import APIRouter
from controllers.card_controller import CardController

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=dict)
async def create_card(data: dict):
    return await CardController.create_card(data)

@router.get("/", response_model=list)
async def get_all_cards():
    return await CardController.get_all_cards()

@router.patch("/{id}", response_model=dict)
async def update_card(id: str, data: dict):
    return await CardController.update_card(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_card(id: str):
    return await CardController.delete_card(id)

@router.post("/{card_ids}/favorite", response_model=dict)
async def toggle_favorite(card_ids: str):
    return await CardController.toggle_favorite(card_ids)